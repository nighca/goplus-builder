import type { FileCollection } from "./base";
import type { CopilotRound } from "./module_Copilot";
import type { XGoPackage } from "./module_XGoExecutor";

export type TutorialEditorConfig =
  | {
      kind: "standard";
    }
  | {
      kind: "simple";
      spriteName: string;
    };

/**
 * Schema of the root `index.json` in a Tutorial project.
 * See `example-tutorial-course/` for a complete directory example.
 */
export type TutorialProjectIndex = {
  formatVersion: 1;
  project: {
    type: "spx";
    root: string;
  };
  tutorial: {
    entry: string;
  };
  copilotContext: string;
  editor: TutorialEditorConfig;
};

/**
 * Persisted Tutorial-project directory. Paths in `index.json` are relative to
 * this collection and may address XGo source, SPX project files or resources.
 */
export type TutorialProjectFiles = FileCollection;

/** TypeScript representation of the XGo Course class framework API. */
export interface CourseAbilities {
  onStart(callback: () => void): void;
  showMessage(message: string): void;
  showVideo(videoPath: string): void;
  complete(): void;
  completeWith(message: string): void;
}

export interface CourseRuntime {
  onStart(callback: () => void): void;
  onExit(callback: (code: number) => void): void;
  onLog(callback: (log: string) => void): void;
}

export interface CourseCodeEditor {
  filterAPIs(apis: string[]): void;
  formatWorkspace(): void;
  getCode(): string;
}

export interface CourseRuler {
  show(): void;
  hide(): void;
}

export interface CourseProject {}

export interface CourseEditor {
  readonly project: CourseProject;
  readonly runtime: CourseRuntime;
  readonly codeEditor: CourseCodeEditor;
  readonly ruler: CourseRuler;
}

export interface CourseCopilot {
  onRoundFinish(callback: (round: CopilotRound) => void): void;
  generateResponse(message: string): string;
}

export interface CourseSpotlight {
  reveal(target: string): void;
}

export interface TutorialCourse extends CourseAbilities {
  readonly editor: CourseEditor;
  readonly copilot: CourseCopilot;
  readonly spotlight: CourseSpotlight;
}

export type TutorialFrameworkEvent =
  | { type: "course.start" }
  | { type: "editor.runtime.start" }
  | { type: "editor.runtime.exit"; code: number }
  | { type: "editor.runtime.log"; log: string }
  | { type: "copilot.roundFinish"; round: CopilotRound };

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

export interface TutorialFrameworkBinding {
  readonly xgoPackage: XGoPackage;
  dispatch(event: TutorialFrameworkEvent): Promise<void>;
}

export interface TutorialFrameworkFactory {
  create(host: TutorialFrameworkHost): TutorialFrameworkBinding;
}
