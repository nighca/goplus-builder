/**
 * `initialization`: worker/WASM startup; `configuration`: framework selection; `build`: XGo compilation;
 * `runtime`: interpreted program execution; `capability`: the UI-side capability handler or RPC transport.
 */
export type XGoErrorPhase = 'initialization' | 'configuration' | 'build' | 'runtime' | 'capability'

/** The terminal state reported exactly once for every started executor worker. */
export type XGoExitReason = 'completed' | 'stopped' | 'error'

export type RunMessage = {
  type: 'run'
  framework: string
  files: Record<string, Uint8Array>
}

export type StopMessage = { type: 'stop' }

export type CapabilityResultMessage = {
  type: 'capabilityResult'
  id: number
  result: unknown
  error: string | null
}

export type MainMessage = RunMessage | StopMessage | CapabilityResultMessage

export type ReadyMessage = { type: 'ready' }
export type StartedMessage = { type: 'started' }
export type ErrorMessage = { type: 'error'; phase: XGoErrorPhase; message: string }
export type ExitMessage = { type: 'exit'; reason: XGoExitReason }
export type CapabilityMessage = { type: 'capability'; id: number; name: string; request: unknown }

export type WorkerMessage = ReadyMessage | StartedMessage | ErrorMessage | ExitMessage | CapabilityMessage
