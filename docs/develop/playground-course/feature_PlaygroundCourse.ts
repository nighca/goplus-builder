import type { Disposer } from "./base";
import type { Copilot } from "./module_Copilot";
import type {
  ProjectEditorProps,
  SimpleProjectEditorProps,
  SpxProjectEditorContext,
  SpxProjectEditorFactory,
} from "./module_SpxProjectEditor";
import type {
  PlaygroundCourseRunInput,
  TutorialDriver,
  TutorialView,
} from "./module_Tutorial";
import type {
  TutorialEditorConfig,
  TutorialFrameworkFactory,
} from "./module_TutorialFramework";
import type { XGoExecutor, XGoExecutorFactory } from "./module_XGoExecutor";
import { ProjectEditor, SimpleProjectEditor } from "./module_SpxProjectEditor";

declare const copilot: Copilot;
declare const editorFactory: SpxProjectEditorFactory;
declare const executorFactory: XGoExecutorFactory;
declare const frameworkFactory: TutorialFrameworkFactory;
declare const view: TutorialView;

/** Key Playground Course orchestration. Marginal error handling is intentionally omitted. */
export class PlaygroundCourseRunner implements TutorialDriver {
  private editor: SpxProjectEditorContext | null = null;
  private executor: XGoExecutor | null = null;
  private disposers: Disposer[] = [];
  private completed = false;

  constructor(private input: PlaygroundCourseRunInput) {}

  async start() {
    const editor = editorFactory.create(this.input.project);
    this.editor = editor;
    view.mountEditor(createEditorUI(editor, this.input.editor));

    await copilot.startSession({
      title: { en: this.input.course.title, zh: this.input.course.title },
      description: this.input.course.copilotContext,
      reactToEvents: false,
      endable: false,
      allowCodeHelper: false,
    });

    const binding = frameworkFactory.create({
      showMessage: (message) => view.showMessage(message),
      showVideo: (path) => view.showVideo(this.input.localFiles[path]),
      complete: (message) => this.complete(message),
      filterAPIs: (apis) => editor.codeEditor.filterAPIs(apis),
      formatWorkspace: () => editor.codeEditor.formatWorkspace(),
      getCode: () => editor.codeEditor.readCurrentCode() ?? "",
      setRulerVisible: (visible) => editor.stageViewer.setRulerVisible(visible),
      generateResponse: (message) =>
        copilot.generateResponse({ response: "text", message }),
      reveal: (target) => editor.spotlight.reveal(target),
    });
    const executor = executorFactory.create({
      onOutput: () => {},
      onError: () => {},
      onExit: () => {},
    });
    this.executor = executor;

    this.disposers.push(
      editor.runtime.on("didStart", () =>
        binding.dispatch({ type: "editor.runtime.start" }),
      ),
      editor.runtime.on("didExit", (code) =>
        binding.dispatch({ type: "editor.runtime.exit", code }),
      ),
      editor.runtime.on("didOutput", (output) => {
        if (output.kind === "log")
          binding.dispatch({ type: "editor.runtime.log", log: output.message });
      }),
      copilot.onRoundFinish((round) =>
        binding.dispatch({ type: "copilot.roundFinish", round }),
      ),
    );

    await executor.run({
      entry: this.input.program.entry,
      files: this.input.program.files,
      imports: [binding.xgoPackage],
    });
    await binding.dispatch({ type: "course.start" });
  }

  async stop() {
    for (const dispose of this.disposers.splice(0)) dispose();
    await this.executor?.stop();
    copilot.endCurrentSession();
    this.editor?.state.dispose();
  }

  private async complete(message: string | null) {
    if (this.completed) return;
    this.completed = true;
    await this.stop();
    await view.showCourseCompletion(message);
  }
}

function createEditorUI(
  context: SpxProjectEditorContext,
  editor: TutorialEditorConfig,
) {
  if (editor.kind === "standard")
    return ProjectEditor({ context } satisfies ProjectEditorProps);
  return SimpleProjectEditor({
    context,
    spriteName: editor.spriteName,
  } satisfies SimpleProjectEditorProps);
}
