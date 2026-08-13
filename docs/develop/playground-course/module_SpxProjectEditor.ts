import type { Disposer, RuntimeOutput, SpxProject, UI } from "./base";

/**
 * Route inside Project Editor. Simple Mode extends the existing route space
 * with `/simple/sprites/<sprite-name>`.
 */
export type InEditorRoute = string;

/** Existing runtime owned by `EditorState`. */
export interface Runtime {
  readonly outputs: readonly RuntimeOutput[];
  /** New event needed by the Tutorial Class Framework runtime namespace. */
  on(event: "didStart", listener: () => void): Disposer;
  on(event: "didChangeOutput", listener: () => void): Disposer;
  on(event: "didExit", listener: (code: number) => void): Disposer;
}

/** Existing Editor State, extended to recognize Simple Mode routes. */
export interface EditorState {
  readonly project: SpxProject;
  readonly runtime: Runtime;
  dispose(): void;
}

/** Existing Editor Context shape; other editor services remain independently provided. */
export type SpxProjectEditorContext = {
  project: SpxProject;
  state: EditorState;
};

/**
 * Relevant API of the existing generic `CodeEditor` class. The last three
 * methods are the additions needed by Tutorial Class Framework and Simple Mode.
 */
export interface CodeEditor {
  /** Existing workspace formatter. */
  formatWorkspace(): Promise<void>;
  /** Existing workspace diagnostics API. */
  diagnosticWorkspace(signal?: AbortSignal): Promise<unknown>;
  /** Restricts the APIs offered by editor assistance for the current Course. */
  filterAPIs(apis: string[]): void;
  /** Reads the code opened in the currently attached Code Editor UI. */
  getCurrentCode(): string | null;
  /** Inserts text at the current selection in the attached Code Editor UI. */
  insertText(text: string): Promise<void>;
}

export type ProjectEditorProps = {
  /** Initial route; subsequent navigation is synchronized through EditorState. */
  inEditorRoute: InEditorRoute;
};

export type StageViewerProps = {
  /** Whether the Ruler overlay is visible. */
  rulerVisible: boolean;
};

export type StageViewerEmits = {
  /** Emitted when the learner clicks a revealed sprite name. */
  spriteNameClick: [spriteName: string];
};

/**
 * Existing SPX Project Editor. It consumes Editor Context from
 * `EditorContextProvider` and handles Simple Mode composition internally.
 */
export declare function ProjectEditor(props: ProjectEditorProps): UI;

/** Stage Viewer component contract extended for Tutorial-controlled UI. */
export declare function StageViewer(props: StageViewerProps): UI;
