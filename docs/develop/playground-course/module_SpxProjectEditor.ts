import type {
  Diagnostic,
  Disposer,
  RuntimeOutput,
  SpxProject,
  UI,
} from "./base";

export interface ProjectRuntime {
  on(event: "didStart", listener: () => void): Disposer;
  on(event: "didExit", listener: (code: number) => void): Disposer;
  on(event: "didOutput", listener: (output: RuntimeOutput) => void): Disposer;
}

export interface ProjectCodeEditor {
  filterAPIs(apis: string[]): void;
  formatWorkspace(): Promise<void>;
  readCurrentCode(): string | null;
  getDiagnostics(): Promise<Diagnostic[]>;
  insertTextAtCursor(text: string): void;
}

export interface ProjectEditorMode {
  /** Locks the workspace to one sprite and applies the Simple Mode presentation. */
  useSimpleMode(spriteName: string): Disposer;
}

export interface ProjectStageViewer {
  onSpriteNameClick(listener: (spriteName: string) => void): Disposer;
}

export interface ProjectEditorSpotlight {
  reveal(target: string): Promise<void>;
}

export interface EditorState {
  dispose(): void;
}

export type SpxProjectEditorContext = {
  project: SpxProject;
  state: EditorState;
  runtime: ProjectRuntime;
  codeEditor: ProjectCodeEditor;
  mode: ProjectEditorMode;
  stageViewer: ProjectStageViewer;
  spotlight: ProjectEditorSpotlight;
};

export interface SpxProjectEditorFactory {
  create(project: SpxProject): SpxProjectEditorContext;
  cloneProject(project: SpxProject): Promise<SpxProject>;
}

export type ProjectEditorProps = {
  context: SpxProjectEditorContext;
};

export type SimpleProjectEditorProps = ProjectEditorProps & {
  spriteName: string;
};

export type SpriteCodeEditorProps = ProjectEditorProps & {
  spriteName: string;
};

/** Existing standard SPX Project Editor. */
export declare function ProjectEditor(props: ProjectEditorProps): UI;

/** Code Editor building block shared by SPX Project Editor compositions. */
export declare function SpriteCodeEditor(props: SpriteCodeEditorProps): UI;

/** Stage Viewer building block shared by SPX Project Editor compositions. */
export declare function StageViewer(props: ProjectEditorProps): UI;

/** Simple Mode composition built from shared SPX Project Editor building blocks. */
export declare function SimpleProjectEditor(
  props: SimpleProjectEditorProps,
): UI;
