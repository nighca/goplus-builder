/// <reference lib="webworker" />

import '@/assets/wasm/wasm_exec.js'

import type { MainMessage, WorkerMessage, XGoErrorPhase, XGoExitReason } from './protocol'

declare const self: DedicatedWorkerGlobalScope
declare class Go {
  importObject: WebAssembly.Imports
  run(instance: WebAssembly.Instance): Promise<void>
}

const wasmUrl = new URL('@/assets/wasm/xgoexec.wasm', import.meta.url).href

interface XGoExecutorBridge {
  /** Configures the only project in this WASM runtime. An empty name selects plain XGo. */
  xbuilder_xgoexec_configure(framework: string): Promise<void>
  /** Builds all project files. It must run after configure and before run. */
  xbuilder_xgoexec_build(files: Record<string, Uint8Array>): Promise<void>
  /** Starts the built program and resolves after startup, not after program exit. */
  xbuilder_xgoexec_run(): Promise<void>
  /** Requests cancellation of the running program. */
  xbuilder_xgoexec_stop(): Promise<void>
  /** Delivers an asynchronous capability result back to the blocked XGo call. */
  xbuilder_xgoexec_resolve_capability(id: number, result: string, error: string): void
  /** Called once all bridge methods above are installed by Go. */
  xbuilder_xgoexec_ready(): void
  /** Reports interpreter failures. The Go bridge currently emits the `runtime` phase. */
  xbuilder_xgoexec_error(phase: 'runtime', message: string): void
  /** Reports natural completion, cancellation, or runtime failure. */
  xbuilder_xgoexec_exit(reason: XGoExitReason): void
  /** Starts a capability RPC. The result is returned through `xbuilder_xgoexec_resolve_capability`. */
  xbuilder_xgoexec_capability(id: number, name: string, request: string): void
}

interface WorkerScope {
  postMessage(message: WorkerMessage): void
  addEventListener(type: 'message', listener: (event: MessageEvent<MainMessage>) => void): void
}

const scope: WorkerScope = self
const bridge = globalThis as unknown as XGoExecutorBridge
let exited = false
let started = false
let pendingExit: XGoExitReason | null = null

bridge.xbuilder_xgoexec_ready = () => scope.postMessage({ type: 'ready' })
bridge.xbuilder_xgoexec_error = (phase, message) => scope.postMessage({ type: 'error', phase, message })
bridge.xbuilder_xgoexec_exit = (reason) => {
  if (started) emitExit(reason)
  else pendingExit = reason
}
bridge.xbuilder_xgoexec_capability = (id, name, request) => {
  scope.postMessage({ type: 'capability', id, name, request: JSON.parse(request) })
}

async function runProject(message: Extract<MainMessage, { type: 'run' }>) {
  try {
    await bridge.xbuilder_xgoexec_configure(message.framework)
  } catch (error) {
    fail('configuration', error)
    return
  }
  try {
    await bridge.xbuilder_xgoexec_build(message.files)
  } catch (error) {
    fail('build', error)
    return
  }
  try {
    await bridge.xbuilder_xgoexec_run()
    started = true
    scope.postMessage({ type: 'started' })
    if (pendingExit != null) emitExit(pendingExit)
  } catch (error) {
    fail('runtime', error)
  }
}

async function stopProject() {
  try {
    await bridge.xbuilder_xgoexec_stop()
    emitExit('stopped')
  } catch (error) {
    fail('runtime', error)
  }
}

function resolveCapability(message: Extract<MainMessage, { type: 'capabilityResult' }>) {
  let result = 'null'
  let error = message.error ?? ''
  if (error === '') {
    try {
      result = JSON.stringify(message.result ?? null)
    } catch (reason) {
      error = toErrorMessage(reason)
    }
  }
  bridge.xbuilder_xgoexec_resolve_capability(message.id, result, error)
}

function fail(phase: XGoErrorPhase, error: unknown) {
  scope.postMessage({ type: 'error', phase, message: toErrorMessage(error) })
  emitExit('error')
}

function emitExit(reason: XGoExitReason) {
  if (exited) return
  exited = true
  scope.postMessage({ type: 'exit', reason })
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

scope.addEventListener('message', (event) => {
  const message = event.data
  switch (message.type) {
    case 'run':
      void runProject(message)
      break
    case 'stop':
      void stopProject()
      break
    case 'capabilityResult':
      resolveCapability(message)
      break
  }
})

async function main() {
  try {
    const go = new Go()
    const { instance } = await WebAssembly.instantiateStreaming(fetch(wasmUrl), go.importObject)
    void go.run(instance).catch((error) => fail('initialization', error))
  } catch (error) {
    fail('initialization', error)
  }
}

void main()
