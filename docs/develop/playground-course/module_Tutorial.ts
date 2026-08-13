import type { Files, SpxProject, TextFiles, UI } from "./base";
import type {
  Course,
  CourseSeries,
  PlaygroundEditor,
} from "./module_CourseApis";

export interface TutorialDriver {
  start(): Promise<void>;
  stop(): Promise<void>;
}

export type PlaygroundCourseRunInput = {
  course: {
    id: string | null;
    title: string;
    copilotContext: string;
  };
  series: CourseSeries | null;
  project: SpxProject;
  program: {
    entry: string;
    files: TextFiles;
  };
  localFiles: Files;
  editor: PlaygroundEditor;
};

export interface PlaygroundCourseRunnerFactory {
  create(input: PlaygroundCourseRunInput): TutorialDriver;
}

/** UI owned by the Tutorial module rather than the Project Editor. */
export interface TutorialView {
  mountEditor(editor: UI): void;
  showMessage(message: string): Promise<void>;
  showVideo(file: File): Promise<void>;
  showCompletion(): Promise<void>;
}

/** Coordinates course selection and delegates behavior to the matching driver. */
export interface Tutorial {
  readonly currentCourse: Course | null;
  readonly currentSeries: CourseSeries | null;
  startCourse(course: Course, series: CourseSeries): Promise<void>;
  endCurrentCourse(): Promise<void>;
}
