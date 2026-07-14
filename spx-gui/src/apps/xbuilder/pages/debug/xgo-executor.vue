<script setup lang="ts">
import { ref } from 'vue'
import { createTutorialFramework, XGoExecutor } from '@/utils/xgo-executor'
import { UIButton, UICard, useMessage } from '@/components/ui'

const message = useMessage()
const result = ref('')
let executor: XGoExecutor | null = null
const onError = (phase: string, content: string) => {
  result.value = `${phase}: ${content}`
}

async function runPlain() {
  result.value = ''
  try {
    executor = new XGoExecutor({ framework: null, onError })
    await executor.run({ 'main.xgo': 'import "time"\necho "plain XGo is running"\ntime.Sleep(time.Minute)' })
    result.value = 'plain XGo is running'
  } catch (error) {
    result.value = String(error)
  }
}

async function runTutorial() {
  result.value = ''
  try {
    executor = new XGoExecutor({ framework: createTutorialFramework(message.info), onError })
    await executor.run({ 'main_course.gox': 'onStart => {\n  showMessage "Tutorial course started"\n}' })
    result.value = 'tutorial class framework is running'
  } catch (error) {
    result.value = String(error)
  }
}

function stop() {
  executor?.stop()
  result.value = 'stopped'
}
</script>

<template>
  <main class="mx-auto max-w-2xl p-8">
    <h1 class="mb-6 text-2xl font-semibold">XGo executor debug</h1>
    <UICard class="p-6">
      <div class="flex gap-3">
        <UIButton type="primary" @click="runPlain">Run plain XGo</UIButton>
        <UIButton type="secondary" @click="runTutorial">Run tutorial course</UIButton>
        <UIButton type="neutral" @click="stop">Stop</UIButton>
      </div>
      <pre v-if="result !== ''" class="mt-5 whitespace-pre-wrap">{{ result }}</pre>
    </UICard>
  </main>
</template>
