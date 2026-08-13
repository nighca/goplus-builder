import type { FileCollection } from "./base";
import type { XGoExecutor, XGoFramework } from "./module_XGoExecutor";

/**
 * Schema of the root `index.json` in a Tutorial project.
 * See `example-tutorial-course/` for a complete directory example.
 */
export type TutorialProjectIndex = {
  /** Directory containing the serialized learner project. */
  project: {
    /** Project model used to load the directory. */
    type: "spx";
    /** Course-relative path to the project root. */
    root: string;
  };
  /** Initial route inside Project Editor, including mode and selection. */
  inEditorRoute: string;
  /** Private instructions appended to the Playground Course Copilot Topic. */
  copilotContext: string;
};

/**
 * Persisted Tutorial-project directory. Paths in `index.json` are relative to
 * this collection and may address XGo source, SPX project files or resources.
 */
export type TutorialProjectFiles = FileCollection;

/** Host capabilities available to the framework implementation. */
export interface TutorialFrameworkHost {
  showMessage(message: string): Promise<void>;
  showVideo(videoPath: string): Promise<void>;
  complete(message: string | null): Promise<void>;
  filterAPIs(apis: string[]): void;
  formatWorkspace(): Promise<void>;
  getCode(): string;
  setRulerVisible(visible: boolean): void;
  generateResponse(message: string): Promise<string>;
  reveal(target: string): Promise<void>;
}

/** Creates the framework passed to `XGoExecutorOptions.framework`. */
export declare function createTutorialFramework(
  host: TutorialFrameworkHost,
): XGoFramework;

/** Dispatches a Tutorial-framework event to the running program. */
export declare function dispatchTutorialEvent(
  executor: XGoExecutor,
  name: string,
  payload: unknown,
): Promise<void>;
