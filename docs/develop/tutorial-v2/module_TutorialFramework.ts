import type { FileCollection, JSONSchema, ProjectType } from "./base";
import type { XGoFramework } from "./module_XGoExecutor";

/**
 * Schema of the root `index.json` in a Tutorial project.
 * See `example-tutorial-course/` for a complete directory example.
 */
export type TutorialProjectIndex = {
  /** Directory containing the serialized learner project. */
  project: {
    /** Project model used to load the directory. */
    type: ProjectType;
    /** Course-relative path to the project root. */
    root: string;
  };
  /** Initial route inside Project Editor, including mode and selection. */
  inEditorRoute: string;
  /** Course-author-provided instructions not shown in the learner UI. */
  copilotContext: string;
};

/**
 * Persisted Tutorial-project directory. Paths in `index.json` are relative to
 * this collection and may address XGo source, SPX project files or resources.
 */
export type TutorialProjectFiles = FileCollection;

/** A Course-local video resource stored under `assets/videos/<name>`. */
export type TutorialVideoConfig = {
  /** Media file path relative to the video's own directory. */
  path: string;
};

/** The resource layout used by a Course-local video. */
export type TutorialVideoResource = {
  name: string;
  config: TutorialVideoConfig;
  file: string;
};

/** Controls how the spotlight presents a UI target. */
export type SpotlightRevealOptions = {
  /**
   * Dims everything except the revealed target with a translucent overlay.
   * The overlay never blocks pointer events; it only directs the learner's
   * attention.
   */
  mask: boolean;
  /**
   * Keeps the spotlight visible until the learner clicks anywhere, instead of
   * auto-concealing after a short delay.
   */
  persist: boolean;
};

/** Flat capabilities passed to the Tutorial framework implementation. */
export interface TutorialFrameworkHost {
  /**
   * Displays the Course opening guide with the given message. Resolves after
   * the learner dismisses it; presentation never advances automatically.
   */
  course_showPrelude(preludeMessage: string): Promise<void>;
  /**
   * Displays a message dialog. Resolves after the learner dismisses it;
   * presentation never advances automatically.
   */
  course_showMessage(message: string): Promise<void>;
  /**
   * Displays a Course-local video resource by name. The name is resolved
   * against `assets/videos/<name>/index.json`; Course code never passes a
   * relative media path, so the Tutorial language service can validate the
   * reference against the project's declared resources.
   */
  course_showVideo(videoName: string): Promise<void>;
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
  /** Generates text without adding a Copilot conversation round. */
  copilot_generateText(message: string): Promise<string>;
  /** Generates a JSON value conforming to the framework-derived schema. */
  copilot_generateJSON(message: string, schema: JSONSchema): Promise<unknown>;
  /**
   * Focuses the existing Spotlight on a UI target and shows a short tip
   * beside it. Spotlight presentation never blocks the Course flow.
   * `target` is a stable UI-target ID owned and published by the SPX Project
   * Editor; session-local Radar node IDs are not valid targets.
   */
  spotlight_reveal(
    target: string,
    tip: string,
    options: SpotlightRevealOptions,
  ): Promise<void>;
}

/** Creates the framework passed to `XGoExecutorOptions.framework`. */
export declare function createTutorialFramework(
  host: TutorialFrameworkHost,
): XGoFramework;
