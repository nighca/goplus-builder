import type { MainMessage, WorkerMessage, XGoErrorPhase, XGoExitReason } from './protocol'

/** A JSON-compatible request/response handler. Returning a Promise makes the XGo call wait asynchronously. */
export type XGoCapability = (request: unknown) => unknown | Promise<unknown>

/** A framework name and its explicitly allowed UI capabilities. */
export type XGoFramework = { name: string; capabilities: Record<string, XGoCapability> }

export type XGoExecutorOptions = {
  /** `null` runs plain XGo; otherwise the name selects the Go-side binding and capabilities bind it to the UI. */
  framework: XGoFramework | null
  /** Receives failures using the phases documented by `XGoErrorPhase`. */
  onError: (phase: XGoErrorPhase, message: string) => void
  /** Receives lines written by the XGo program, including `echo` output. */
  onOutput?: (message: string) => void
  /** Fires exactly once when execution completes, is stopped, or exits because of an error. */
  onExit: (reason: XGoExitReason) => void
}

interface WorkerHandler {
  postMessage(message: MainMessage): void
  addEventListener(type: 'message', listener: (event: MessageEvent<WorkerMessage>) => void): void
  addEventListener(type: 'error', listener: (event: ErrorEvent) => void): void
  terminate(): void
}

type Deferred<T> = {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason: unknown) => void
}

/**
 * Runs one XGo project at a time in a dedicated Web Worker/WASM runtime.
 * Call `run` again after `onExit` for sequential projects. Use a separate executor for a different framework or for
 * concurrent execution; separate executors are isolated but each loads its own WASM runtime.
 *
 * The dedicated worker keeps XGo compilation and interpretation off the UI thread and isolates the Go bridge globals
 * used by each WASM runtime. The tradeoff is one WASM instance per concurrent executor; a shared worker would require
 * the Go bridge to address multiple runtimes and is a possible optimization if this cost becomes significant.
 */
export class XGoExecutor {
  private worker: WorkerHandler | null = null
  private state: 'idle' | 'starting' | 'running' = 'idle'
  private exitDeferred: Deferred<void> | null = null
  private nextEventCallId = 0
  private pendingEventCalls = new Map<number, Deferred<void>>()

  constructor(private options: XGoExecutorOptions) {}

  /** Builds and starts a project. The promise resolves when execution starts; completion is reported through `onExit`. */
  async run(files: Record<string, string>): Promise<void> {
    if (this.state !== 'idle') throw new Error('XGo executor is already running')
    this.state = 'starting'
    const worker: WorkerHandler = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
    const ready = createDeferred<void>()
    const started = createDeferred<void>()
    this.exitDeferred = createDeferred<void>()
    this.worker = worker
    worker.addEventListener('message', (event) => this.handleMessage(worker, event.data, ready, started))
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
    })
    await started.promise
  }

  /** Requests cancellation and resolves after `onExit('stopped')` has been emitted. */
  async stop(): Promise<void> {
    const worker = this.worker
    const exitDeferred = this.exitDeferred
    if (worker == null || exitDeferred == null) return
    if (this.state === 'starting') {
      this.finish(worker, 'stopped')
      return
    }
    worker.postMessage({ type: 'stop' })
    await exitDeferred.promise
  }

  /** Dispatches a framework event and resolves once the running program has accepted it. */
  async dispatchEvent(name: string, payload: unknown): Promise<void> {
    const worker = this.worker
    if (worker == null || this.state !== 'running') throw new Error('XGo executor is not running')
    const id = ++this.nextEventCallId
    const deferred = createDeferred<void>()
    this.pendingEventCalls.set(id, deferred)
    try {
      worker.postMessage({ type: 'event', id, name, payload })
    } catch (error) {
      this.pendingEventCalls.delete(id)
      throw error
    }
    await deferred.promise
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
        void this.handleCapabilityCall(worker, message.id, message.name, message.request)
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

  private async handleCapabilityCall(worker: WorkerHandler, id: number, name: string, request: unknown) {
    try {
      const capability = this.options.framework?.capabilities[name]
      if (capability == null) throw new Error(`unsupported capability: ${name}`)
      const result = await capability(request)
      if (worker !== this.worker) return
      worker.postMessage({ type: 'capabilityCallResult', id, result, error: null })
    } catch (error) {
      if (worker !== this.worker) return
      const message = toErrorMessage(error)
      this.options.onError('capability', message)
      worker.postMessage({ type: 'capabilityCallResult', id, result: null, error: message })
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

function createDeferred<T>(): Deferred<T> {
  let resolvePromise: (value: T) => void = () => {}
  let rejectPromise: (reason: unknown) => void = () => {}
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve
    rejectPromise = reject
  })
  return { promise, resolve: resolvePromise, reject: rejectPromise }
}

function encodeFiles(files: Record<string, string>): Record<string, Uint8Array> {
  return Object.fromEntries(Object.entries(files).map(([path, content]) => [path, new TextEncoder().encode(content)]))
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}
