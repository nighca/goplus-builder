import type { Files, SpxProject, TextFiles, UI } from "./base";
import type { Course, CourseSeries } from "./module_CourseApis";
import type { TutorialEditorConfig } from "./module_TutorialFramework";

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
  editor: TutorialEditorConfig;
};

export interface PlaygroundCourseRunnerFactory {
  create(input: PlaygroundCourseRunInput): TutorialDriver;
}

export type PlaygroundCourseSeriesRunInput = {
  series: CourseSeries;
  courses: PlaygroundCourseRunInput[];
};

export interface PlaygroundCourseSeriesRunnerFactory {
  create(input: PlaygroundCourseSeriesRunInput): TutorialDriver;
}

/** UI owned by the Tutorial module rather than the Project Editor. */
export interface TutorialView {
  mountEditor(editor: UI): void;
  showMessage(message: string): Promise<void>;
  showVideo(file: File): Promise<void>;
  /** Shows completion after active course resources have been stopped. */
  showCourseCompletion(message: string | null): Promise<void>;
}

/** Coordinates course selection and delegates behavior to the matching driver. */
export interface Tutorial {
  readonly currentCourse: Course | null;
  readonly currentSeries: CourseSeries | null;
  startCourse(course: Course, series: CourseSeries): Promise<void>;
  endCurrentCourse(): Promise<void>;
}
