import {
  editor as IEditor,
  type IDisposable,
  type IPosition,
  type IRange,
  languages,
  Position
} from 'monaco-editor'
import { Disposable } from '@/utils/disposable'
import {
  type CompletionMenu,
  icon2CompletionItemKind
} from '@/components/editor/code-editor/ui/features/completion-menu/completion-menu'
import { InlayHint } from '@/components/editor/code-editor/ui/features/inlay-hint/inlay-hint'
import loader from '@monaco-editor/loader'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import { injectMonacoHighlightTheme } from '@/components/editor/code-editor/ui/common/languages'
import type { Project } from '@/models/project'
import type { I18n, LocaleMessage } from '@/utils/i18n'
import type { FormatResponse } from '@/apis/util'
import formatWasm from '@/assets/format.wasm?url'
import type { HoverPreview } from '@/components/editor/code-editor/ui/features/hover-preview/hover-preview'
import { ChatBotModal } from './ui/features/chat-bot/chat-bot-modal'
import { reactive } from 'vue'
import type { Chat } from './chat-bot'

export interface TextModel extends IEditor.ITextModel {}

export enum Icon {
  Function,
  Event,
  Prototype,
  Keywords,
  AIAbility,
  Document,
  Rename,
  Playlist,
  Look,
  Motion,
  Sound,
  Control,
  Sensing,
  Game,
  Variable,
  Listen
}

export type Markdown = string

export enum DocPreviewLevel {
  Normal,
  Warning,
  Error
}

export type DocPreview = {
  level: DocPreviewLevel
  content: Markdown
  recommendAction?: RecommendAction | undefined
  moreActions?: Action[] | undefined
}

export type AudioPlayer = {
  src: string
  duration: number
}

export interface RenamePreview {
  placeholder: string
  onSubmit(
    newName: string,
    ctx: {
      signal: AbortSignal
    },
    setError: (message: string) => void
  ): Promise<void>
}

export type LayerContent = DocPreview | AudioPlayer | RenamePreview

export interface CompletionItem {
  icon: Icon
  label: string
  desc: string
  insertText: string
  preview: LayerContent
}

export type InlayHintBehavior = 'none' | 'triggerCompletion'
export type InlayHintStyle = 'tag' | 'text' | 'icon'

// for we already have class InlayHint
export type InlayHintType = {
  content: string | Icon
  style: InlayHintStyle
  behavior: InlayHintBehavior
  position: IPosition
}

export interface InlayHintsProvider {
  provideInlayHints(
    model: TextModel,
    ctx: {
      signal: AbortSignal
    }
  ): Promise<InlayHintType[]>
}

export type SelectionMenuItem = {
  icon: Icon
  label: string
  action: () => void
}

export interface SelectionMenuProvider {
  provideSelectionMenuItems(
    model: TextModel,
    ctx: {
      selection: IRange
      selectContent: string
    }
  ): Promise<SelectionMenuItem[]>
}

export interface CompletionProvider {
  provideDynamicCompletionItems(
    model: TextModel,
    ctx: {
      position: Position
      unitWord: string
      signal: AbortSignal
    },
    addItems: (items: CompletionItem[]) => void
  ): void
}

export interface HoverProvider {
  provideHover(
    model: TextModel,
    ctx: {
      position: Position
      hoverUnitWord: string
      signal: AbortSignal
    }
  ): Promise<LayerContent[]>
}

export type InputItem = {
  icon: Icon
  label: string
  desc: LayerContent
  sample: string
  insertText: string
}

export type InputItemGroup = {
  label: LocaleMessage
  inputItems: InputItem[]
}

export type InputItemCategory = {
  label: LocaleMessage
  icon: Icon
  color: string
  groups: InputItemGroup[]
}

interface InputAssistantProvider {
  provideInputAssistant(ctx: { signal: AbortSignal }): Promise<InputItemCategory[]>
}

export enum AttentionHintLevelEnum {
  WARNING,
  ERROR
}

export type AttentionHint = {
  level: AttentionHintLevelEnum
  range: IRange
  message: string
  hoverContent: LayerContent
}

export interface AttentionHintsProvider {
  provideAttentionHints(
    setHints: (hints: AttentionHint[]) => void,
    ctx: {
      signal: AbortSignal
    }
  ): void
}

export type RecommendAction = {
  label: string
  activeLabel: string
  onActiveLabelClick(): void | LayerContent
}

export type Action = {
  icon: Icon
  label: string
  onClick(): void | LayerContent
}

export type DocDetail = Markdown

export type ReplyAction = {
  message: string
}

export type Reply = {
  message: Markdown
  actions: ReplyAction[]
}

export type AIChatModalOptions = {
  initialMessage: string
  reply?: (userMessage: Markdown) => Promise<Reply>
}

interface EditorUIRequestCallback {
  completion: CompletionProvider[]
  hover: HoverProvider[]
  selectionMenu: SelectionMenuProvider[]
  inlayHints: InlayHintsProvider[]
  inputAssistant: InputAssistantProvider[]
  attentionHints: AttentionHintsProvider[]
}

declare global {
  /** Notice: this is available only after `initFormatWasm()` */
  function formatSPX(input: string): FormatResponse
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function initFormatWasm() {
  const go = new Go()
  const result = await WebAssembly.instantiateStreaming(fetch(formatWasm), go.importObject)
  go.run(result.instance)
}

export class EditorUI extends Disposable {
  i18n: I18n
  getProject: () => Project
  completionMenu: CompletionMenu | null = null
  hoverPreview: HoverPreview | null = null
  inlayHint: InlayHint | null = null
  editorUIRequestCallback: EditorUIRequestCallback
  monaco: typeof import('monaco-editor') | null = null
  monacoProviderDisposes: Record<string, IDisposable | null> = {
    completionProvider: null,
    hoverProvider: null
  }

  chatBotModal: ChatBotModal

  documentDetailState = reactive<{
    visible: boolean
    document: DocDetail
  }>({
    visible: false,
    document: ''
  })

  setCompletionMenu(completionMenu: CompletionMenu) {
    this.completionMenu = completionMenu
  }

  getCompletionMenu() {
    return this.completionMenu
  }

  setHoverPreview(hoverPreview: HoverPreview) {
    this.hoverPreview = hoverPreview
  }

  getHoverPreview() {
    return this.hoverPreview
  }

  setInlayHint(inlayHint: InlayHint) {
    this.inlayHint = inlayHint
  }

  getInlayHint() {
    return this.hoverPreview
  }

  constructor(i18n: I18n, getProject: () => Project) {
    super()

    this.i18n = i18n

    this.getProject = getProject
    this.editorUIRequestCallback = {
      completion: [],
      hover: [],
      selectionMenu: [],
      inlayHints: [],
      inputAssistant: [],
      attentionHints: []
    }

    this.chatBotModal = new ChatBotModal()

    this.addDisposer(() => {
      for (const callbackKey in this.editorUIRequestCallback) {
        this.editorUIRequestCallback[callbackKey as keyof EditorUIRequestCallback].length = 0
      }
    })

    this.addDisposer(() => this.disposeMonacoProviders())
  }

  public async getMonaco() {
    if (this.monaco) return this.monaco
    const monaco_ = await loader.init()
    if (this.monaco) return this.monaco
    this.disposeMonacoProviders()
    await this.initMonaco(monaco_, this.getProject)
    this.monaco = monaco_
    return this.monaco
  }

  async initMonaco(monaco: typeof import('monaco-editor'), getProject: () => Project) {
    self.MonacoEnvironment = {
      getWorker() {
        return new EditorWorker()
      }
    }

    const LANGUAGE_NAME = 'spx'
    monaco.languages.register({
      id: LANGUAGE_NAME
    })

    // keep this for auto match brackets when typing
    monaco.languages.setLanguageConfiguration(LANGUAGE_NAME, {
      // tokenize all words as identifiers
      wordPattern: /(-?\d*\.\d\w*)|([^`~!@#%^&*()\-=+[{\]}\\|;:'",.<>/?\s]+)/g,
      comments: {
        lineComment: '//',
        blockComment: ['/*', '*/']
      },
      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
        ['"', '"'],
        ["'", "'"]
      ]
    })

    // TODO: monaco editor completion is not fully match our features, we need implement it by self, we may need do following,
    //  trigger completion menu by handle listen keyboard down, up, shortcut, mouse down up, focus, blur, and custom fuzzy search to match completion item.
    // current bug is when you type same code remove it then type it, it will show duplicate completion items depends on how many times you repeat it.
    // because our completionMenuCache use { lineNumber: number, column: number, fileId: string  } to make completionMenuCacheID，thus, we can not recognize the difference between old typing and new typing and typing code is same.
    // in `completionItemCache` i try to add function `has` to force avoid duplicate item in `completionItemCache`
    this.monacoProviderDisposes.completionProvider =
      monaco.languages.registerCompletionItemProvider(LANGUAGE_NAME, {
        provideCompletionItems: (model, position) => {
          if (!this.completionMenu) throw new Error('completionMenu is null')

          // get current position id to determine if need to request completion provider resolve
          const word = model.getWordUntilPosition(position)
          const project = getProject()
          const fileHash = project.currentFilesHash || ''
          const completionItemCacheID = {
            id: fileHash,
            lineNumber: position.lineNumber,
            column: word.startColumn
          }
          if (!word.word) {
            this.completionMenu.hideCompletionMenu()
            return { suggestions: [] }
          }
          // if completionItemCacheID changed, inner cache will clean `cached data`
          // in a word, if CompletionItemCacheID changed will call `requestCompletionProviderResolve`
          const isNeedRequestCompletionProviderResolve =
            !this.completionMenu.completionItemCache.isCacheAvailable(completionItemCacheID)
          if (isNeedRequestCompletionProviderResolve) {
            const abortController = new AbortController()
            this.requestCompletionProviderResolve(
              model,
              {
                position,
                unitWord: word.word,
                signal: abortController.signal
              },
              (items: CompletionItem[]) => {
                if (!this.completionMenu) return console.warn('completionMenu is null')
                const isSamePosition =
                  this.completionMenu.completionItemCache.isSamePosition(completionItemCacheID)
                if (!isSamePosition) return abortController.abort()

                this.completionMenu.completionItemCache.add(completionItemCacheID, items)
                // if you need user immediately show updated completion items, we need close it and reopen it.
                this.completionMenu.hideCompletionMenu()
                this.completionMenu.showCompletionMenu()
              }
            )
            return { suggestions: [] }
          } else {
            const suggestions =
              this.completionMenu.completionItemCache.getAll(completionItemCacheID).map(
                (item): languages.CompletionItem => ({
                  label: item.label,
                  kind: icon2CompletionItemKind(item.icon),
                  insertText: item.insertText,
                  insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
                  range: {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn
                  }
                })
              ) || []
            return { suggestions }
          }
        }
      })

    const isDocPreview = (layer: LayerContent): layer is DocPreview =>
      'content' in layer && 'level' in layer

    const isAudioPlayer = (layer: LayerContent): layer is AudioPlayer =>
      'src' in layer && 'duration' in layer

    const isRenamePreview = (layer: LayerContent): layer is RenamePreview =>
      'placeholder' in layer && 'onSubmit' in layer

    const isMouseColumnInWordRange = (startColumn: number, endColumn: number) => {
      if (!this.inlayHint) return false
      const mouseColumn = this.inlayHint.mouseColumn
      return mouseColumn >= startColumn && mouseColumn <= endColumn
    }

    this.monacoProviderDisposes.hoverProvider = monaco.languages.registerHoverProvider(
      LANGUAGE_NAME,
      {
        provideHover: async (model, position, token) => {
          const word = model.getWordAtPosition(position)
          if (word == null) return

          // this used for inlay hint, when mouse hover function param tag, hover provider should not work
          if (!isMouseColumnInWordRange(word.startColumn, word.endColumn)) return

          const abortController = new AbortController()
          token.onCancellationRequested(() => abortController.abort())
          const result = (
            await this.requestHoverProviderResolve(model, {
              signal: abortController.signal,
              hoverUnitWord: word.word,
              position
            })
          ).flat()

          // filter docPreview
          this.hoverPreview?.showDocuments(result.filter(isDocPreview), {
            startLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endLineNumber: position.lineNumber,
            endColumn: word.endColumn
          })

          return {
            // we only need to know when to trigger hover preview, no need to show raw content
            // so here we return empty result
            contents: []
          }
        }
      }
    )

    await injectMonacoHighlightTheme(monaco)
  }

  /**
   * providers need to be disposed before the editor is destroyed.
   * otherwise, it will cause duplicate completion items when HMR is triggered in development mode.
   */
  private disposeMonacoProviders() {
    if (this.monacoProviderDisposes.completionProvider) {
      this.monacoProviderDisposes.completionProvider.dispose()
      this.monacoProviderDisposes.completionProvider = null
    }
    if (this.monacoProviderDisposes.hoverProvider) {
      this.monacoProviderDisposes.hoverProvider.dispose()
      this.monacoProviderDisposes.hoverProvider = null
    }
  }

  public requestCompletionProviderResolve(
    model: TextModel,
    ctx: {
      position: Position
      unitWord: string
      signal: AbortSignal
    },
    addItems: (items: CompletionItem[]) => void
  ) {
    this.editorUIRequestCallback.completion.forEach((item) =>
      item.provideDynamicCompletionItems(model, ctx, addItems)
    )
  }

  public async requestHoverProviderResolve(
    model: TextModel,
    ctx: {
      position: Position
      hoverUnitWord: string
      signal: AbortSignal
    }
  ) {
    const promiseResults = await Promise.all(
      this.editorUIRequestCallback.hover.map((item) => item.provideHover(model, ctx))
    )
    return promiseResults.flat().filter(Boolean)
  }

  public async requestSelectionMenuProviderResolve(
    model: TextModel,
    ctx: {
      selection: IRange
      selectContent: string
    }
  ) {
    const promiseResults = await Promise.all(
      this.editorUIRequestCallback.selectionMenu.map((item) =>
        item.provideSelectionMenuItems(model, ctx)
      )
    )
    return promiseResults.flat().filter(Boolean)
  }

  public async requestInlayHintProviderResolve(
    model: TextModel,
    ctx: {
      signal: AbortSignal
    }
  ) {
    const promiseResults = await Promise.all(
      this.editorUIRequestCallback.inlayHints.map((item) => item.provideInlayHints(model, ctx))
    )
    return promiseResults.flat().filter(Boolean)
  }

  public async requestInputAssistantProviderResolve(ctx: {
    signal: AbortSignal
  }): Promise<InputItemCategory[]> {
    const promiseResults = await Promise.all(
      this.editorUIRequestCallback.inputAssistant.map((item) => item.provideInputAssistant(ctx))
    )
    return promiseResults.flat().filter(Boolean)
  }
  public registerCompletionProvider(provider: CompletionProvider) {
    this.editorUIRequestCallback.completion.push(provider)
  }
  public registerInlayHintsProvider(provider: InlayHintsProvider) {
    this.editorUIRequestCallback.inlayHints.push(provider)
  }
  public registerSelectionMenuProvider(provider: SelectionMenuProvider) {
    this.editorUIRequestCallback.selectionMenu.push(provider)
  }
  public registerHoverProvider(provider: HoverProvider) {
    this.editorUIRequestCallback.hover.push(provider)
  }
  public registerAttentionHintsProvider(provider: AttentionHintsProvider) {
    this.editorUIRequestCallback.attentionHints.push(provider)
  }
  public registerInputAssistantProvider(provider: InputAssistantProvider) {
    this.editorUIRequestCallback.inputAssistant.push(provider)
  }
  public invokeAIChatModal(chat: Chat) {
    this.chatBotModal.setChat(chat)
    this.chatBotModal.setVisible(true)
  }
  public invokeDocumentDetail(docDetail: DocDetail) {
    this.documentDetailState.visible = true
    this.documentDetailState.document = docDetail
  }
}