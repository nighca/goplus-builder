import type { Disposer, UI } from "./base";
import type { SimpleProjectEditorProps } from "./module_SpxProjectEditor";
import { SpriteCodeEditor, StageViewer } from "./module_SpxProjectEditor";

declare function onMounted(setup: () => Disposer): void;
declare function renderSimpleEditor(parts: {
  codeEditor: UI;
  stageViewer: UI;
}): UI;

/** Simple Mode is a sibling composition of the standard Project Editor. */
export function SimpleProjectEditor(props: SimpleProjectEditorProps): UI {
  onMounted(() => {
    const disposeMode = props.context.mode.useSimpleMode(props.spriteName);
    const disposeNameClick = props.context.stageViewer.onSpriteNameClick(
      (spriteName) => {
        props.context.codeEditor.insertTextAtCursor(spriteName);
      },
    );
    return () => {
      disposeNameClick();
      disposeMode();
    };
  });

  return renderSimpleEditor({
    codeEditor: SpriteCodeEditor({
      context: props.context,
      spriteName: props.spriteName,
    }),
    stageViewer: StageViewer({ context: props.context }),
  });
}
