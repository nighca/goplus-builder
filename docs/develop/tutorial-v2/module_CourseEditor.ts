import type { UI } from "./base";

export type CourseEditorProps = {
  courseSeriesID: string;
  courseID: string;
};

/**
 * Loads and edits the identified Course and its Tutorial-project directory.
 * It uses Course APIs internally for loading and saving.
 * Tutorial-program diagnostics and completion are provided by a Language Server owned by this module.
 */
export declare function CourseEditor(props: CourseEditorProps): UI;
