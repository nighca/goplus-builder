import type { CourseEditorState } from "./module_CourseEditor";
import type { SpxProjectEditorFactory } from "./module_SpxProjectEditor";
import type {
  PlaygroundCourseRunnerFactory,
  TutorialDriver,
} from "./module_Tutorial";

declare const editorFactory: SpxProjectEditorFactory;
declare const runnerFactory: PlaygroundCourseRunnerFactory;

let previewRunner: TutorialDriver | null = null;

/** Runs the real Playground Course flow from the Course Editor's unsaved in-memory state. */
export async function previewCourse(editorState: CourseEditorState) {
  await previewRunner?.stop();

  const editing = editorState.course;
  const previewProject = await editorFactory.cloneProject(editing.project);
  previewRunner = runnerFactory.create({
    course: {
      id: editing.id,
      title: editing.title,
      copilotContext: editing.copilotContext,
    },
    series: editorState.series,
    project: previewProject,
    program: {
      entry: editing.program.entry,
      files: { ...editing.program.files },
    },
    localFiles: { ...editing.localFiles },
    editor: editing.editor,
  });

  await previewRunner.start();
}
