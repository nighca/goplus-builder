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

export type CapabilityCallResultMessage = {
  type: 'capabilityCallResult'
  id: number
  result: unknown
  error: string | null
}

export type EventMessage = { type: 'event'; id: number; name: string; payload: unknown }

export type MainMessage = RunMessage | StopMessage | CapabilityCallResultMessage | EventMessage

export type ReadyMessage = { type: 'ready' }
export type StartedMessage = { type: 'started' }
export type ErrorMessage = { type: 'error'; phase: XGoErrorPhase; message: string }
export type ExitMessage = { type: 'exit'; reason: XGoExitReason }
export type OutputMessage = { type: 'output'; message: string }
export type CapabilityCallMessage = { type: 'capabilityCall'; id: number; name: string; request: unknown }
export type EventResultMessage = { type: 'eventResult'; id: number; error: string | null }

export type WorkerMessage =
  | ReadyMessage
  | StartedMessage
  | ErrorMessage
  | ExitMessage
  | OutputMessage
  | CapabilityCallMessage
  | EventResultMessage
