import type {
  CourseSeriesEditorState,
  PlaygroundCourseEditingState,
} from "./module_CourseEditor";
import type { SpxProjectEditorFactory } from "./module_SpxProjectEditor";
import type {
  PlaygroundCourseRunInput,
  PlaygroundCourseSeriesRunnerFactory,
  TutorialDriver,
} from "./module_Tutorial";

declare const editorFactory: SpxProjectEditorFactory;
declare const seriesRunnerFactory: PlaygroundCourseSeriesRunnerFactory;

let previewRunner: TutorialDriver | null = null;

/** Walks an unsaved Course Series with the real Playground Course flow. */
export async function previewCourseSeries(state: CourseSeriesEditorState) {
  await previewRunner?.stop();
  const courses = await Promise.all(
    state.courses.map((course) => toRunInput(course, state.series)),
  );
  previewRunner = seriesRunnerFactory.create({ series: state.series, courses });
  await previewRunner.start();
}

async function toRunInput(
  course: PlaygroundCourseEditingState,
  series: CourseSeriesEditorState["series"],
): Promise<PlaygroundCourseRunInput> {
  return {
    course: {
      id: course.id,
      title: course.title,
      copilotContext: course.copilotContext,
    },
    series,
    project: await editorFactory.cloneProject(course.project),
    program: {
      entry: course.program.entry,
      files: { ...course.program.files },
    },
    localFiles: { ...course.localFiles },
    editor: course.editor,
  };
}
