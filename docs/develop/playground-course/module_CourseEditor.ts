import type { Files, SpxProject, TextFiles, UI } from "./base";
import type { CourseSeries, PlaygroundEditor } from "./module_CourseApis";

export type PlaygroundCourseEditingState = {
  id: string | null;
  title: string;
  thumbnail: File | null;
  project: SpxProject;
  program: {
    entry: string;
    files: TextFiles;
  };
  localFiles: Files;
  copilotContext: string;
  editor: PlaygroundEditor;
};

/** In-memory Course Editor state. Preview reads it without saving first. */
export interface CourseEditorState {
  readonly course: PlaygroundCourseEditingState;
  readonly series: CourseSeries | null;
  save(): Promise<void>;
}

export type CourseEditorProps = {
  state: CourseEditorState;
};

/**
 * Edits metadata, the embedded project, Tutorial program, local files and Copilot context.
 * Tutorial-program diagnostics and completion are provided by a Language Server owned by this module.
 */
export declare function CourseEditor(props: CourseEditorProps): UI;
