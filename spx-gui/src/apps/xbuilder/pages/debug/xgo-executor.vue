<script setup lang="ts">
import { ref } from 'vue'
import {
  createTutorialFramework,
  dispatchTutorialSubmit,
  XGoExecutor,
  type TutorialProgress
} from '@/utils/xgo-executor'
import { UIButton, UICard, UITextInput, useMessage } from '@/components/ui'

const PLAIN_XGO_SOURCE = `
import (
  "sort"
  "strconv"
  "strings"
  "time"
)

values := []int{3, 1, 2}
sort.Ints(values)
for i := 1; i <= 60; i++ {
  echo strings.ToUpper("plain XGo tick") + " " + strconv.Itoa(i), values
  time.Sleep(time.Second)
}
`

const QUICK_XGO_SOURCE = `
echo "quick XGo completed"
`

const TUTORIAL_XGO_SOURCE = `
onStart => {
  code := readCode()
  showMessage "Current code: " + code
  setProgress 1, 2
}

onSubmit submission => {
  showMessage "Submitted: " + submission
  setProgress 2, 2
}
`

const message = useMessage()
const userCode = ref('onStart => {\n  showMessage "Hello"\n}')
const submission = ref('My course answer')
const plainStatus = ref('idle')
const tutorialStatus = ref('idle')
const progress = ref<TutorialProgress>({ completed: 0, total: 2 })
const events = ref<string[]>([])
let plainExecutor: XGoExecutor | null = null
let tutorialExecutor: XGoExecutor | null = null

async function runPlain(source = PLAIN_XGO_SOURCE) {
  plainStatus.value = 'starting'
  plainExecutor = new XGoExecutor({
    framework: null,
    onError: (phase, content) => {
      plainStatus.value = `${phase}: ${content}`
    },
    onOutput: (content) => events.value.push(`plain output: ${content}`),
    onExit: (reason) => {
      plainStatus.value = `exited: ${reason}`
      events.value.push(`plain exited: ${reason}`)
    }
  })
  try {
    await plainExecutor.run({ 'main.xgo': source })
    plainStatus.value = 'running'
  } catch (error) {
    plainStatus.value = String(error)
  }
}

async function runTutorial() {
  tutorialStatus.value = 'starting'
  progress.value = { completed: 0, total: 2 }
  const framework = createTutorialFramework({
    showMessage: (content) => {
      events.value.push(`message: ${content}`)
      message.info(content)
    },
    readCode: async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 100))
      events.value.push('code read')
      return userCode.value
    },
    setProgress: (value) => {
      progress.value = value
      events.value.push(`progress: ${value.completed}/${value.total}`)
    }
  })
  tutorialExecutor = new XGoExecutor({
    framework,
    onError: (phase, content) => {
      tutorialStatus.value = `${phase}: ${content}`
    },
    onExit: (reason) => {
      tutorialStatus.value = `exited: ${reason}`
      events.value.push(`tutorial exited: ${reason}`)
    }
  })
  try {
    await tutorialExecutor.run({ 'main_course.gox': TUTORIAL_XGO_SOURCE })
    if (tutorialStatus.value === 'starting') tutorialStatus.value = 'running'
  } catch (error) {
    tutorialStatus.value = String(error)
  }
}

async function submit() {
  if (tutorialExecutor == null) return
  try {
    await dispatchTutorialSubmit(tutorialExecutor, submission.value)
    events.value.push(`submission dispatched: ${submission.value}`)
  } catch (error) {
    tutorialStatus.value = String(error)
  }
}

async function stopAll() {
  await Promise.all([plainExecutor?.stop(), tutorialExecutor?.stop()])
}
</script>

<template>
  <main class="mx-auto max-w-3xl p-8">
    <h1 class="mb-6 text-2xl font-semibold">XGo executor debug</h1>
    <UICard class="space-y-5 p-6">
      <div class="flex gap-3">
        <UIButton
          type="primary"
          :disabled="plainStatus === 'starting' || plainStatus === 'running'"
          @click="runPlain()"
        >
          Run plain XGo
        </UIButton>
        <UIButton
          type="secondary"
          :disabled="plainStatus === 'starting' || plainStatus === 'running'"
          @click="runPlain(QUICK_XGO_SOURCE)"
        >
          Run quick XGo
        </UIButton>
        <UIButton
          type="secondary"
          :disabled="tutorialStatus === 'starting' || tutorialStatus === 'running'"
          @click="runTutorial"
        >
          Run tutorial course
        </UIButton>
        <UIButton type="neutral" @click="stopAll">Stop all</UIButton>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <label class="space-y-2">
          <span class="text-sm font-medium">Code returned by readCode</span>
          <UITextInput v-model:value="userCode" type="textarea" :rows="4" />
        </label>
        <label class="space-y-2">
          <span class="text-sm font-medium">Submission dispatched to onSubmit</span>
          <UITextInput v-model:value="submission" />
          <UIButton type="secondary" :disabled="tutorialStatus !== 'running'" @click="submit">Submit</UIButton>
        </label>
      </div>

      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>Plain: {{ plainStatus }}</div>
        <div>Tutorial: {{ tutorialStatus }}</div>
        <div>Progress: {{ progress.completed }}/{{ progress.total }}</div>
      </div>

      <pre v-if="events.length > 0" class="whitespace-pre-wrap">{{ events.join('\n') }}</pre>
    </UICard>
  </main>
</template>
