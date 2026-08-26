import { watch } from 'vue'
import type { WatchStopHandle } from 'vue'

import { XGoExecutor, type XGoExecutorOptions, type XGoExitReason, type XGoFramework } from '@/utils/xgoexec'
import { mainCourseFilePath } from '@/models/tutorial/course'
import type { TutorialProject } from '@/models/tutorial/project'
import type { Copilot, Round, Topic } from '@/components/copilot/copilot'
import { RoundState } from '@/components/copilot/copilot'
import type { Runtime } from '@/components/editor/runtime'
import { RuntimeOutputKind } from '@/components/editor/runtime'

type PlaygroundSession = {
  readonly currentRound: Round | null
}
type PlaygroundCopilot = Pick<Copilot, 'startSession' | 'endCurrentSession'> & {
  readonly currentSession: PlaygroundSession | null
}
type PlaygroundExecutor = Pick<XGoExecutor, 'run' | 'stop' | 'dispatchEvent'>
type CreateExecutor = (options: XGoExecutorOptions) => PlaygroundExecutor

export type PlaygroundCoursePresentation = {
  showMessage(content: string): Promise<void>
  dismiss(): void
}

export type PlaygroundCourseCompletion = {
  feedback: string | null
}

export type PlaygroundCourseRunnerOptions = {
  project: TutorialProject
  editorRuntime: Runtime
  copilot: PlaygroundCopilot
  presentation: PlaygroundCoursePresentation
  onComplete(completion: PlaygroundCourseCompletion): void
  onFailure(error: Error): void
  createExecutor?: CreateExecutor
}

type CompletionWithRequest = {
  feedback: string
}

export class PlaygroundCourseRunner {
  private executor: PlaygroundExecutor
  private session: PlaygroundSession | null = null
  private eventQueue = Promise.resolve()
  private eventBridgeDisposers: Array<() => void> = []
  private completion: PlaygroundCourseCompletion | null = null
  private completionTimer: ReturnType<typeof setTimeout> | null = null
  private lastRuntimeOutputID = -1
  private lastError: Error | null = null
  private state: 'idle' | 'starting' | 'running' | 'stopping' | 'finished' = 'idle'
  private settled = false
  private executorStarted = deferred<void>()

  constructor(private options: PlaygroundCourseRunnerOptions) {
    const createExecutor = options.createExecutor ?? ((executorOptions) => new XGoExecutor(executorOptions))
    this.executor = createExecutor({
      framework: this.createFramework(),
      onError: (phase, message) => {
        this.lastError = new Error(`Tutorial ${phase}: ${message}`)
      },
      onExit: (reason) => this.handleExecutorExit(reason)
    })
  }

  async start() {
    if (this.state !== 'idle') throw new Error('Playground Course runtime has already started')
    this.state = 'starting'

    const { project, copilot } = this.options
    await copilot.startSession(this.createCopilotTopic(project))
    this.session = copilot.currentSession
    if (this.state !== 'starting') {
      if (copilot.currentSession === this.session) copilot.endCurrentSession()
      return
    }
    this.installEventBridge()

    try {
      await this.executor.run({ [mainCourseFilePath]: project.mainCourse.code })
      if (this.state !== 'starting') return
      this.state = 'running'
      this.executorStarted.resolve()
    } catch (error) {
      this.executorStarted.reject(error)
      if (this.state === 'starting' || this.state === 'running') {
        void this.finishWithFailure(errorOf(error))
      }
      throw error
    }
  }

  async dispose() {
    if (this.state === 'stopping' || this.state === 'finished') return
    this.state = 'stopping'
    if (this.completionTimer != null) clearTimeout(this.completionTimer)
    this.completionTimer = null
    this.eventBridgeDisposers.splice(0).forEach((dispose) => dispose())
    this.options.presentation.dismiss()
    if (this.options.copilot.currentSession === this.session) this.options.copilot.endCurrentSession()
    await this.executor.stop()
    this.state = 'finished'
  }

  private createFramework(): XGoFramework {
    return {
      name: 'tutorial',
      capabilities: {
        course_showMessage: (request) => this.options.presentation.showMessage(readString(request, 'content')),
        course_complete: () => this.acceptCompletion(null),
        course_completeWith: (request) => this.acceptCompletion(readCompletionWithRequest(request).feedback)
      }
    }
  }

  private createCopilotTopic(project: TutorialProject): Topic {
    return {
      title: { en: project.title, zh: project.title },
      description: project.config?.copilotContext ?? '',
      reactToEvents: false,
      endable: true
    }
  }

  private installEventBridge() {
    const runtime = this.options.editorRuntime
    this.eventBridgeDisposers.push(
      runtime.on('didChangeOutput', () => {
        for (const output of runtime.outputs) {
          if (output.id <= this.lastRuntimeOutputID) continue
          this.lastRuntimeOutputID = output.id
          if (output.kind === RuntimeOutputKind.Log) this.dispatchEvent('editor.runtime.log', { log: output.message })
        }
      }),
      runtime.on('didExit', (code) => this.dispatchEvent('editor.runtime.exit', { code })),
      watch(
        () => runtime.running,
        (running, previous) => {
          const started = running.mode === 'debug' && !running.initializing && running.initializingError == null
          const wasStarted = previous?.mode === 'debug' && !previous.initializing && previous.initializingError == null
          if (started && !wasStarted) this.dispatchEvent('editor.runtime.start', null)
        },
        { immediate: true }
      ),
      this.watchCopilotRoundFinish()
    )
  }

  private watchCopilotRoundFinish(): WatchStopHandle {
    const session = this.session
    return watch(
      () => {
        const round = session?.currentRound ?? null
        return [round, round?.state ?? null] as const
      },
      ([round, state]) => {
        if (round == null || state !== RoundState.Completed) return
        this.dispatchEvent('copilot.roundFinish', serializeRound(round))
      }
    )
  }

  private dispatchEvent(name: string, payload: unknown) {
    this.eventQueue = this.eventQueue
      .then(async () => {
        await this.executorStarted.promise
        if (this.state !== 'running') return
        await this.executor.dispatchEvent(name, payload)
      })
      .catch((error) => {
        if (this.state === 'running') void this.finishWithFailure(errorOf(error))
      })
  }

  private acceptCompletion(feedback: string | null) {
    if (this.completion != null) return
    this.completion = { feedback }
    this.completionTimer = setTimeout(() => {
      this.completionTimer = null
      void this.finishWithCompletion()
    })
  }

  private handleExecutorExit(reason: XGoExitReason) {
    if (this.state === 'stopping' || this.state === 'finished') return
    if (reason === 'completed') {
      if (this.completion != null) void this.finishWithCompletion()
      else void this.finishWithFailure(new Error('Tutorial Course ended without completing'))
      return
    }
    if (reason === 'error') {
      void this.finishWithFailure(this.lastError ?? new Error('Tutorial Course failed'))
    }
  }

  private async finishWithCompletion() {
    if (this.settled || this.completion == null) return
    this.settled = true
    const completion = this.completion
    await this.dispose()
    this.options.onComplete(completion)
  }

  private async finishWithFailure(error: Error) {
    if (this.settled) return
    this.settled = true
    await this.dispose()
    this.options.onFailure(error)
  }
}

function serializeRound(round: Round) {
  return JSON.parse(
    JSON.stringify({
      userMessage: round.userMessage,
      resultMessages: round.resultMessages
    })
  )
}

function readCompletionWithRequest(request: unknown): CompletionWithRequest {
  return { feedback: readString(request, 'feedback') }
}

function readString(value: unknown, key: string) {
  if (typeof value !== 'object' || value == null || !(key in value)) throw new Error(`missing ${key}`)
  const result = value[key as keyof typeof value]
  if (typeof result !== 'string') throw new Error(`${key} must be a string`)
  return result
}

function errorOf(value: unknown) {
  return value instanceof Error ? value : new Error(String(value))
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((ok, fail) => {
    resolve = ok
    reject = fail
  })
  void promise.catch(() => {})
  return { promise, resolve, reject }
}
