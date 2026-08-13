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

/** Flat capabilities passed to the Tutorial framework implementation. */
export interface TutorialFrameworkHost {
  /** Displays a message dialog. */
  course_showMessage(message: string): Promise<void>;
  /** Displays a Course-local video. */
  course_showVideo(videoPath: string): Promise<void>;
  /** Completes the Course without feedback. */
  course_complete(): Promise<void>;
  /** Completes the Course and displays feedback. */
  course_completeWith(message: string): Promise<void>;
  /** Limits APIs offered by Code Editor assistance. */
  editor_codeEditor_filterAPIs(apis: string[]): void;
  /** Formats the current code workspace. */
  editor_codeEditor_formatWorkspace(): Promise<void>;
  /** Returns the learner's current code. */
  editor_codeEditor_getCode(): string;
  /** Displays the Ruler overlay. */
  editor_ruler_show(): void;
  /** Hides the Ruler overlay. */
  editor_ruler_hide(): void;
  /** Generates a response without adding a Copilot conversation round. */
  copilot_generateResponse(message: string): Promise<string>;
  /** Focuses the existing Spotlight on a UI target. */
  spotlight_reveal(target: string): Promise<void>;
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
