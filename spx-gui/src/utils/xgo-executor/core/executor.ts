import type { MainMessage, WorkerMessage, XGoErrorPhase, XGoExitReason } from './protocol'

export type XGoCapability = (request: unknown) => unknown | Promise<unknown>
export type XGoFramework = { name: string; capabilities: Record<string, XGoCapability> }
export type XGoExecutorOptions = {
  framework: XGoFramework | null
  onError: (phase: XGoErrorPhase, message: string) => void
  onOutput?: (message: string) => void
  onExit: (reason: XGoExitReason) => void
}
type WorkerHandler = Pick<Worker, 'postMessage' | 'addEventListener' | 'terminate'>
type Deferred<T> = { promise: Promise<T>; resolve: (value: T) => void; reject: (reason: unknown) => void }

/** Runs one XGo project in a dedicated Worker/WASM instance. */
export class XGoExecutor {
  private worker: WorkerHandler | null = null
  private state: 'idle' | 'starting' | 'running' = 'idle'
  private exitDeferred: Deferred<void> | null = null
  private nextEventCallId = 0
  private pendingEventCalls = new Map<number, Deferred<void>>()

  constructor(private readonly options: XGoExecutorOptions) {}

  async run(files: Record<string, string>): Promise<void> {
    if (this.state !== 'idle') throw new Error('XGo executor is already running')
    this.state = 'starting'
    const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
    const ready = deferred<void>()
    const started = deferred<void>()
    this.exitDeferred = deferred<void>()
    this.worker = worker
    worker.addEventListener('message', (event: MessageEvent<WorkerMessage>) =>
      this.handleMessage(worker, event.data, ready, started)
    )
    worker.addEventListener('error', (event) => {
      const error = new Error(event.message)
      this.options.onError('initialization', error.message)
      ready.reject(error)
      started.reject(error)
      this.finish(worker, 'error')
    })
    await ready.promise
    worker.postMessage({
      type: 'run',
      framework: this.options.framework?.name ?? '',
      files: encodeFiles(files)
    } satisfies MainMessage)
    await started.promise
  }

  async stop(): Promise<void> {
    const worker = this.worker
    const exit = this.exitDeferred
    if (worker == null || exit == null) return
    if (this.state === 'starting') {
      this.finish(worker, 'stopped')
      return
    }
    worker.postMessage({ type: 'stop' } satisfies MainMessage)
    await exit.promise
  }
  async dispatchEvent(name: string, payload: unknown): Promise<void> {
    if (this.worker == null || this.state !== 'running') throw new Error('XGo executor is not running')
    const id = ++this.nextEventCallId
    const call = deferred<void>()
    this.pendingEventCalls.set(id, call)
    this.worker.postMessage({ type: 'event', id, name, payload } satisfies MainMessage)
    await call.promise
  }
  private handleMessage(worker: WorkerHandler, message: WorkerMessage, ready: Deferred<void>, started: Deferred<void>) {
    if (worker !== this.worker) return
    switch (message.type) {
      case 'ready':
        ready.resolve()
        break
      case 'started':
        this.state = 'running'
        started.resolve()
        break
      case 'error': {
        const error = new Error(`${message.phase}: ${message.message}`)
        this.options.onError(message.phase, message.message)
        if (message.phase === 'initialization') ready.reject(error)
        else if (this.state === 'starting') started.reject(error)
        break
      }
      case 'exit':
        this.finish(worker, message.reason)
        break
      case 'output':
        this.options.onOutput?.(message.message)
        break
      case 'capabilityCall':
        void this.handleCapabilityCall(worker, message)
        break
      case 'eventResult': {
        const call = this.pendingEventCalls.get(message.id)
        if (call == null) break
        this.pendingEventCalls.delete(message.id)
        if (message.error == null) call.resolve()
        else call.reject(new Error(message.error))
        break
      }
    }
  }
  private async handleCapabilityCall(
    worker: WorkerHandler,
    message: Extract<WorkerMessage, { type: 'capabilityCall' }>
  ) {
    try {
      const capability = this.options.framework?.capabilities[message.name]
      if (capability == null) throw new Error(`unsupported capability: ${message.name}`)
      const result = await capability(message.request)
      if (worker === this.worker)
        worker.postMessage({ type: 'capabilityCallResult', id: message.id, result, error: null } satisfies MainMessage)
    } catch (error) {
      if (worker === this.worker) {
        const text = error instanceof Error ? error.message : String(error)
        this.options.onError('capability', text)
        worker.postMessage({
          type: 'capabilityCallResult',
          id: message.id,
          result: null,
          error: text
        } satisfies MainMessage)
      }
    }
  }
  private finish(worker: WorkerHandler, reason: XGoExitReason) {
    if (worker !== this.worker) return
    worker.terminate()
    this.worker = null
    this.state = 'idle'
    for (const call of this.pendingEventCalls.values()) call.reject(new Error(`XGo executor exited: ${reason}`))
    this.pendingEventCalls.clear()
    this.options.onExit(reason)
    this.exitDeferred?.resolve()
    this.exitDeferred = null
  }
}
function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((ok, fail) => {
    resolve = ok
    reject = fail
  })
  return { promise, resolve, reject }
}
function encodeFiles(files: Record<string, string>): Record<string, Uint8Array> {
  return Object.fromEntries(Object.entries(files).map(([path, content]) => [path, new TextEncoder().encode(content)]))
}
