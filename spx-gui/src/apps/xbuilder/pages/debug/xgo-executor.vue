<script setup lang="ts">
import { ref } from 'vue'
import { XGoExecutor } from '@/utils/xgo-executor'
import { UIButton, UICard, useMessage } from '@/components/ui'

const message = useMessage()
const result = ref('')

async function runPlain() {
  result.value = ''
  try { await new XGoExecutor('none', message.info).run({ 'main.xgo': 'echo "plain XGo is running"' }); result.value = 'plain XGo ran successfully' } catch (error) { result.value = String(error) }
}
async function runTutorial() {
  result.value = ''
  try { await new XGoExecutor('tutorial', message.info).run({ 'main.course': 'onStart => {\n  showMessage "Tutorial course started"\n}' }); result.value = 'tutorial class framework ran successfully' } catch (error) { result.value = String(error) }
}
</script>

<template>
  <main class="mx-auto max-w-2xl p-8">
    <h1 class="mb-6 text-2xl font-semibold">XGo executor debug</h1>
    <UICard class="p-6">
      <div class="flex gap-3"><UIButton type="primary" @click="runPlain">Run plain XGo</UIButton><UIButton type="secondary" @click="runTutorial">Run tutorial course</UIButton></div>
      <pre v-if="result !== ''" class="mt-5 whitespace-pre-wrap">{{ result }}</pre>
    </UICard>
  </main>
</template>
