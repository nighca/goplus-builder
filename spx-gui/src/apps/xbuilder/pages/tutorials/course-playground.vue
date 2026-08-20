<script setup lang="ts">
import { computed } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

import { useQuery } from '@/utils/query'
import CoursePlayground from '@/components/tutorials/playground/CoursePlayground.vue'
import { usePlaygroundTutorial } from '@/components/tutorials/playground-tutorial'
import { useTutorial } from '@/components/tutorials/tutorial'
import { UIDetailedLoading, UIError } from '@/components/ui'

const props = defineProps<{
  courseSeriesIdInput: string
  courseIdInput: string
}>()

const tutorial = useTutorial()
const playgroundTutorial = usePlaygroundTutorial()
const entryAtSetup = playgroundTutorial.currentEntry

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

onBeforeRouteLeave(() => {
  if (entry.value != null) playgroundTutorial.endCurrentCourse()
})
</script>

<template>
  <CoursePlayground v-if="entry != null" :key="entry.key" :project="entry.project" />
  <section v-else class="h-full w-full flex items-center justify-center">
    <UIDetailedLoading v-if="startQueryRet.isLoading.value" :percentage="startQueryRet.progress.value.percentage">
      <span>{{ $t({ zh: '加载课程中...', en: 'Loading course...' }) }}</span>
    </UIDetailedLoading>
    <UIError v-else-if="startQueryRet.error.value != null" :retry="startQueryRet.refetch">
      {{ $t(startQueryRet.error.value.userMessage) }}
    </UIError>
  </section>
</template>
