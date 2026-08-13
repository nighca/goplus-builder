import type { CopilotRound } from "./module_Copilot";
import type { XGoPackage } from "./module_XGoExecutor";

/** TypeScript representation of the XGo Course class framework API. */
export interface CourseAbilities {
  onStart(callback: () => void): void;
  showMessage(message: string): void;
  showVideo(videoPath: string): void;
  complete(): void;
}

export interface CourseRuntime {
  onStart(callback: () => void): void;
  onExit(callback: (code: number) => void): void;
  onLog(callback: (log: string) => void): void;
}

export interface CourseCodeEditor {
  filterAPIs(apis: string[]): void;
  formatWorkspace(): void;
}

export interface CourseProject {}

export interface CourseEditor {
  readonly project: CourseProject;
  readonly runtime: CourseRuntime;
  readonly codeEditor: CourseCodeEditor;
}

export interface CourseCopilot {
  onRoundFinish(callback: (round: CopilotRound) => void): void;
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
  complete(): Promise<void>;
  filterAPIs(apis: string[]): void;
  formatWorkspace(): Promise<void>;
  reveal(target: string): Promise<void>;
}

export interface TutorialFrameworkBinding {
  readonly xgoPackage: XGoPackage;
  dispatch(event: TutorialFrameworkEvent): Promise<void>;
}

export interface TutorialFrameworkFactory {
  create(host: TutorialFrameworkHost): TutorialFrameworkBinding;
}
