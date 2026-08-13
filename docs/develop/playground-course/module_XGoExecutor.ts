import type { TextFiles } from "./base";

export type XGoErrorPhase =
  | "initialization"
  | "configuration"
  | "build"
  | "runtime"
  | "capability";
export type XGoExitReason = "completed" | "stopped" | "error";

export type XGoCapability = (
  request: unknown,
  signal: AbortSignal,
) => unknown | Promise<unknown>;

export type XGoPackage = {
  path: string;
  files: TextFiles;
  capabilities: Record<string, XGoCapability>;
};

export type XGoExecutorOptions = {
  onOutput(message: string): void;
  onError(phase: XGoErrorPhase, message: string): void;
  onExit(reason: XGoExitReason): void;
};

export type XGoProgram = {
  entry: string;
  files: TextFiles;
  imports: XGoPackage[];
};

/** Runs an XGo program with caller-provided packages in an isolated Worker/WASM instance. */
export interface XGoExecutor {
  run(program: XGoProgram): Promise<void>;
  dispatchEvent(name: string, payload: unknown): Promise<void>;
  stop(): Promise<void>;
}

export interface XGoExecutorFactory {
  create(options: XGoExecutorOptions): XGoExecutor;
}
