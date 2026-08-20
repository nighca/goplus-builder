<script setup lang="ts">
import { nextTick, onUnmounted, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useI18n } from '@/utils/i18n'
import { useNetwork } from '@/utils/network'
import { useQuery } from '@/utils/query'
import { useSignedInStateQuery } from '@/stores/user'
import { cloudHelpers } from '@/models/common/cloud'
import type { TutorialProject } from '@/models/tutorial/project'
import { useCopilot } from '@/components/copilot/context'
import EditorContextProvider from '@/components/editor/EditorContextProvider.vue'
import type { ILocalCache } from '@/components/editor/editing'
import { EditorState } from '@/components/editor/editor-state'
import EditorNavbar from '@/components/editor/navbar/EditorNavbar.vue'
import ProjectEditor from '@/components/editor/ProjectEditor.vue'
import { CodeEditorProvider, loadMonaco } from '@/components/editor/spx-code-editor'
import { UIButton, UICard, UIDetailedLoading, UIError } from '@/components/ui'

import { PlaygroundCourseRuntime, type PlaygroundCourseCompletion, type PlaygroundCoursePresentation } from './runtime'

const props = defineProps<{
  project: TutorialProject
}>()

const emit = defineEmits<{
  completed: [completion: PlaygroundCourseCompletion]
  failed: [error: Error]
}>()

const localCache: ILocalCache = {
  async load() {
    return null
  },
  async save() {},
  async clear() {}
}

const i18n = useI18n()
const router = useRouter()
const copilot = useCopilot()
const { isOnline } = useNetwork()
const signedInStateQuery = useSignedInStateQuery()

const state = new EditorState(i18n, props.project.project, isOnline, signedInStateQuery, cloudHelpers, localCache)
state.editing.startEditing()
state.syncWithRouter(router)

const monacoQueryRet = useQuery(() => loadMonaco(i18n.lang.value), {
  en: 'Failed to load code editor',
  zh: '加载代码编辑器失败'
})

type PendingMessage = {
  content: string
  resolve(): void
}

const pendingMessage = shallowRef<PendingMessage | null>(null)

function dismissMessage() {
  const message = pendingMessage.value
  pendingMessage.value = null
  message?.resolve()
}

const presentation: PlaygroundCoursePresentation = {
  showMessage(content) {
    dismissMessage()
    return new Promise<void>((resolve) => {
      pendingMessage.value = { content, resolve }
    })
  },
  dismiss: dismissMessage
}

let runtime: PlaygroundCourseRuntime | null = null
let disposed = false
const stopRuntimeStart = watch(
  () => monacoQueryRet.data.value,
  async (monaco) => {
    if (monaco == null) return
    stopRuntimeStart()
    await nextTick()
    if (disposed) return
    runtime = new PlaygroundCourseRuntime({
      project: props.project,
      editorRuntime: state.runtime,
      copilot,
      presentation,
      onComplete: (completion) => emit('completed', completion),
      onFailure: (error) => emit('failed', error)
    })
    void runtime.start().catch(() => {})
  }
)

onUnmounted(() => {
  disposed = true
  stopRuntimeStart()
  dismissMessage()
  void runtime?.dispose()
  state.dispose()
})
</script>

<template>
  <section class="relative min-h-full w-full flex flex-col bg-grey-300">
    <header class="flex-none">
      <EditorNavbar :project="state.project" :state="state" />
    </header>
    <main class="flex-[1_1_0] flex gap-xl p-4 pt-2">
      <UIDetailedLoading v-if="monacoQueryRet.isLoading.value" :percentage="monacoQueryRet.progress.value.percentage">
        <span>{{ $t({ en: 'Loading editor...', zh: '加载编辑器中...' }) }}</span>
      </UIDetailedLoading>
      <UIError v-else-if="monacoQueryRet.error.value != null" :retry="monacoQueryRet.refetch">
        {{ $t(monacoQueryRet.error.value.userMessage) }}
      </UIError>
      <EditorContextProvider v-else :project="state.project" :state="state">
        <CodeEditorProvider :monaco="monacoQueryRet.data.value!">
          <ProjectEditor />
        </CodeEditorProvider>
      </EditorContextProvider>
    </main>

    <div v-if="pendingMessage != null" class="absolute inset-0 flex items-center justify-center bg-black/30 p-8">
      <UICard class="max-w-xl w-full p-6">
        <p class="whitespace-pre-wrap text-base">{{ pendingMessage.content }}</p>
        <div class="mt-6 flex justify-end">
          <UIButton @click="dismissMessage">{{ $t({ en: 'Continue', zh: '继续' }) }}</UIButton>
        </div>
      </UICard>
    </div>
  </section>
</template>
