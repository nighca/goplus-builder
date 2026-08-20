<script setup lang="ts">
import { onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

import { useI18n } from '@/utils/i18n'
import { useNetwork } from '@/utils/network'
import { useQuery } from '@/utils/query'
import { useSignedInStateQuery } from '@/stores/user'
import { cloudHelpers } from '@/models/common/cloud'
import type { TutorialProject } from '@/models/tutorial/project'
import EditorContextProvider from '@/components/editor/EditorContextProvider.vue'
import type { ILocalCache } from '@/components/editor/editing'
import { EditorState } from '@/components/editor/editor-state'
import EditorNavbar from '@/components/editor/navbar/EditorNavbar.vue'
import ProjectEditor from '@/components/editor/ProjectEditor.vue'
import { CodeEditorProvider, loadMonaco } from '@/components/editor/spx-code-editor'
import { UIDetailedLoading, UIError } from '@/components/ui'

const props = defineProps<{
  project: TutorialProject
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
const { isOnline } = useNetwork()
const signedInStateQuery = useSignedInStateQuery()

const state = new EditorState(i18n, props.project.project, isOnline, signedInStateQuery, cloudHelpers, localCache)
state.editing.startEditing()
state.syncWithRouter(router)

onUnmounted(() => state.dispose())

const monacoQueryRet = useQuery(() => loadMonaco(i18n.lang.value), {
  en: 'Failed to load code editor',
  zh: '加载代码编辑器失败'
})
</script>

<template>
  <section class="min-h-full w-full flex flex-col bg-grey-300">
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
  </section>
</template>
