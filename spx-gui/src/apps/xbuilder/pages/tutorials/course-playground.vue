<script setup lang="ts">
import { nextTick, onUnmounted, ref, shallowRef, watch } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'

import { getCourse, type PlaygroundCourse } from '@/apis/course'
import { getCourseSeries, type CourseSeries } from '@/apis/course-series'
import { TutorialProject } from '@/models/tutorial/project'
import { useQuery } from '@/utils/query'
import CoursePlayground from '@/components/tutorials/playground/CoursePlayground.vue'
import CoursePlaygroundCompletionModal, {
  type CompletionAction
} from '@/components/tutorials/playground/CoursePlaygroundCompletionModal.vue'
import type { PlaygroundCourseCompletion } from '@/components/tutorials/playground/runtime'
import { useTutorial } from '@/components/tutorials/tutorial'
import { UIDetailedLoading, UIError, useModal } from '@/components/ui'

const props = defineProps<{
  courseSeriesIdInput: string
  courseIdInput: string
}>()

const tutorial = useTutorial()
const router = useRouter()
const openCompletion = useModal(CoursePlaygroundCompletionModal)
const runtimeError = ref<Error | null>(null)

type PlaygroundEntry = {
  course: PlaygroundCourse
  series: CourseSeries
  project: TutorialProject
}

const entry = shallowRef<PlaygroundEntry | null>(null)

const entryQueryRet = useQuery(
  async (ctx) => {
    const [course, series] = await Promise.all([
      getCourse(props.courseIdInput, ctx.signal),
      getCourseSeries(props.courseSeriesIdInput, ctx.signal)
    ])
    if (course.kind !== 'playground') throw new Error(`course ${course.id} is not a Playground Course`)
    if (!series.courseIDs.includes(course.id)) throw new Error(`course ${course.id} is not in series ${series.id}`)

    const project = await TutorialProject.load(course)
    const inEditorRoute = project.config?.inEditorRoute ?? ''
    const route = `/course/${encodeURIComponent(series.id)}/${encodeURIComponent(course.id)}/playground${
      inEditorRoute.startsWith('/') ? inEditorRoute : `/${inEditorRoute}`
    }`
    await router.replace(route)
    return { course, series, project }
  },
  {
    en: 'Failed to start course',
    zh: '启动课程失败'
  }
)

async function disposeEntry() {
  const current = entry.value
  entry.value = null
  await nextTick()
  current?.project.project.dispose()
}

watch(entryQueryRet.data, async (next) => {
  await disposeEntry()
  entry.value = next
})

async function retryRuntime() {
  runtimeError.value = null
}

async function handleCompleted(completion: PlaygroundCourseCompletion) {
  const completedEntry = entry.value
  if (completedEntry == null) return
  const courseIndex = completedEntry.series.courseIDs.indexOf(completedEntry.course.id)
  const nextCourseID = completedEntry.series.courseIDs[courseIndex + 1] ?? null

  await disposeEntry()
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
  return disposeEntry()
})

onUnmounted(() => void disposeEntry())
</script>

<template>
  <UIError v-if="runtimeError != null" class="h-full" :retry="retryRuntime">
    {{ runtimeError.message }}
  </UIError>
  <CoursePlayground
    v-else-if="entry != null"
    :key="entry.course.id"
    :project="entry.project"
    @completed="handleCompleted"
    @failed="runtimeError = $event"
  />
  <section v-else class="h-full w-full flex items-center justify-center">
    <UIDetailedLoading v-if="entryQueryRet.isLoading.value" :percentage="entryQueryRet.progress.value.percentage">
      <span>{{ $t({ zh: '加载课程中...', en: 'Loading course...' }) }}</span>
    </UIDetailedLoading>
    <UIError v-else-if="entryQueryRet.error.value != null" :retry="entryQueryRet.refetch">
      {{ $t(entryQueryRet.error.value.userMessage) }}
    </UIError>
  </section>
</template>
