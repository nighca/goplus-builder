<script lang="ts">
export type CompletionAction = 'next' | 'exit'
</script>

<script setup lang="ts">
import { UIButton, UIImg, UIModal, UIModalClose } from '@/components/ui'

import successImg from '../success.png'

defineProps<{
  visible: boolean
  courseTitle: string
  feedback: string | null
  hasNextCourse: boolean
}>()

const emit = defineEmits<{
  cancelled: []
  resolved: [action: CompletionAction]
}>()
</script>

<template>
  <UIModal :visible="visible" size="small" @update:visible="emit('resolved', 'exit')">
    <div class="px-5 pt-4 pb-6">
      <div class="flex justify-end">
        <UIModalClose @click="emit('resolved', 'exit')" />
      </div>

      <div class="flex flex-col items-center text-center">
        <UIImg :src="successImg" class="h-47.5 w-67.5" />
        <div class="mt-5 text-2xl">{{ $t({ en: 'Great!', zh: '太棒了！' }) }}</div>
        <div class="mt-2 text-base">
          {{ $t({ en: `${courseTitle} course completed`, zh: `${courseTitle}课程已完成` }) }}
        </div>
        <p v-if="feedback != null" class="mt-3 whitespace-pre-wrap text-sm text-grey-900">{{ feedback }}</p>

        <div class="mt-10 w-full flex flex-col gap-5">
          <UIButton type="neutral" size="large" @click="emit('resolved', 'exit')">
            {{ $t({ en: 'Back to course series', zh: '返回课程系列' }) }}
          </UIButton>
          <UIButton v-if="hasNextCourse" size="large" @click="emit('resolved', 'next')">
            {{ $t({ en: 'Learn next course', zh: '学习下一个课程' }) }}
          </UIButton>
        </div>
      </div>
    </div>
  </UIModal>
</template>
