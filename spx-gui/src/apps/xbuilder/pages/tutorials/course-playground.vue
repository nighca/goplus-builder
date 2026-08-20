<script setup lang="ts">
import { computed, ref } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'

import { useQuery } from '@/utils/query'
import CoursePlayground from '@/components/tutorials/playground/CoursePlayground.vue'
import CoursePlaygroundCompletionModal, {
  type CompletionAction
} from '@/components/tutorials/playground/CoursePlaygroundCompletionModal.vue'
import type { PlaygroundCourseCompletion } from '@/components/tutorials/playground/runtime'
import { usePlaygroundTutorial } from '@/components/tutorials/playground-tutorial'
import { useTutorial } from '@/components/tutorials/tutorial'
import { UIDetailedLoading, UIError, useModal } from '@/components/ui'

const props = defineProps<{
  courseSeriesIdInput: string
  courseIdInput: string
}>()

const tutorial = useTutorial()
const playgroundTutorial = usePlaygroundTutorial()
const router = useRouter()
const openCompletion = useModal(CoursePlaygroundCompletionModal)
const entryAtSetup = playgroundTutorial.currentEntry
const runtimeError = ref<Error | null>(null)

const entry = computed(() => {
  const current = playgroundTutorial.currentEntry
  if (current?.series.id !== props.courseSeriesIdInput || current.course.id !== props.courseIdInput) return null
  return current
})

const startQueryRet = useQuery(
  async () => {
    if (entryAtSetup?.series.id === props.courseSeriesIdInput && entryAtSetup.course.id === props.courseIdInput) {
      return
    }
    await tutorial.startCourse(props.courseSeriesIdInput, props.courseIdInput)
  },
  {
    en: 'Failed to start course',
    zh: '启动课程失败'
  }
)

async function retryRuntime() {
  runtimeError.value = null
  await tutorial.startCourse(props.courseSeriesIdInput, props.courseIdInput)
}

async function handleCompleted(completion: PlaygroundCourseCompletion) {
  const completedEntry = entry.value
  if (completedEntry == null) return
  const courseIndex = completedEntry.series.courseIDs.indexOf(completedEntry.course.id)
  const nextCourseID = completedEntry.series.courseIDs[courseIndex + 1] ?? null

  await tutorial.endCurrentCourse()
  const action: CompletionAction = await openCompletion({
    courseTitle: completedEntry.course.title,
    feedback: completion.feedback,
    hasNextCourse: nextCourseID != null
  })
  if (action === 'next' && nextCourseID != null) {
    await tutorial.startCourse(completedEntry.series.id, nextCourseID)
  } else {
    await router.push(`/course-series/${encodeURIComponent(completedEntry.series.id)}`)
  }
}

onBeforeRouteLeave(() => {
  if (entry.value != null) return playgroundTutorial.endCurrentCourse()
})
</script>

<template>
  <UIError v-if="runtimeError != null" class="h-full" :retry="retryRuntime">
    {{ runtimeError.message }}
  </UIError>
  <CoursePlayground
    v-else-if="entry != null"
    :key="entry.key"
    :project="entry.project"
    @completed="handleCompleted"
    @failed="runtimeError = $event"
  />
  <section v-else class="h-full w-full flex items-center justify-center">
    <UIDetailedLoading v-if="startQueryRet.isLoading.value" :percentage="startQueryRet.progress.value.percentage">
      <span>{{ $t({ zh: '加载课程中...', en: 'Loading course...' }) }}</span>
    </UIDetailedLoading>
    <UIError v-else-if="startQueryRet.error.value != null" :retry="startQueryRet.refetch">
      {{ $t(startQueryRet.error.value.userMessage) }}
    </UIError>
  </section>
</template>
