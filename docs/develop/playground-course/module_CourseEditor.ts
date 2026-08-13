import type { Files, UI } from "./base";
import type { CourseSeries } from "./module_CourseApis";

export type PlaygroundCourseEditingState = {
  id: string | null;
  title: string;
  thumbnail: File | null;
  /** Loaded, unsaved Tutorial-project directory. */
  content: Files;
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
 * Edits metadata and a loaded Tutorial-project directory.
 * Tutorial-program diagnostics and completion are provided by a Language Server owned by this module.
 */
export declare function CourseEditor(props: CourseEditorProps): UI;
