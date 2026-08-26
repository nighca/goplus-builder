<script lang="ts" setup>
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '@/utils/i18n'
import { useIsRouteLoaded } from '@/utils/route-loading'

import { useCopilot } from '@/components/copilot/context'

import { GuidedTutorial, isGuidedTutorialTopic, provideGuidedTutorial } from './guided/guided-tutorial'
import { provideTutorial, Tutorial } from './tutorial'
import * as tutorialCourseSuccess from './guided/TutorialCourseSuccess.vue'
import * as tutorialCourseExitLink from './guided/TutorialCourseExitLink'
import * as tutorialStateIndicator from './guided/TutorialStateIndicator.vue'
import { tutorialCourseAbandonPrediction, tutorialCourseAbandonDismissal } from './guided/tutorial-course-abandon'

const i18n = useI18n()
const copilot = useCopilot()
const router = useRouter()
const isRouteLoaded = useIsRouteLoaded()

const guidedTutorial = new GuidedTutorial(copilot, router, isRouteLoaded)
const tutorial = new Tutorial(guidedTutorial, router)

// TODO: ensure `RegExp.escape` available & use `RegExp.escape` instead
const tutorialCourseSuccessPattern = new RegExp(`<${tutorialCourseSuccess.tagName.replace('-', '\\-')}\\b`)

watch(
  () => guidedTutorial.currentCourse,
  (currentCourse, _, onCleanup) => {
    if (currentCourse == null) return

    const disposers = [
      copilot.registerCustomElement({
        tagName: tutorialCourseSuccess.tagName,
        description: tutorialCourseSuccess.detailedDescription,
        attributes: tutorialCourseSuccess.attributes,
        isRaw: tutorialCourseSuccess.isRaw,
        component: tutorialCourseSuccess.default
      }),
      copilot.registerCustomElement({
        tagName: tutorialCourseExitLink.tagName,
        description: tutorialCourseExitLink.description,
        attributes: tutorialCourseExitLink.attributes,
        isRaw: tutorialCourseExitLink.isRaw,
        component: tutorialCourseExitLink.default
      }),
      copilot.registerCustomElement(tutorialCourseAbandonPrediction),
      copilot.registerCustomElement(tutorialCourseAbandonDismissal),
      copilot.registerStateIndicatorComponent(tutorialStateIndicator.name, tutorialStateIndicator.default),
      copilot.registerQuickInputProvider({
        provideQuickInput(lastCopilotMessage, topic) {
          if (topic == null || !isGuidedTutorialTopic(topic)) return []
          if (lastCopilotMessage?.content != null && tutorialCourseSuccessPattern.test(lastCopilotMessage.content)) {
            return []
          }
          return [
            {
              text: {
                en: 'Next step',
                zh: '下一步'
              },
              message: {
                role: 'user',
                type: 'text',
                content: i18n.t({
                  en: 'I did what you asked. Tell me what to do next.',
                  zh: '我按你说的操作了，接下来该做什么？'
                })
              }
            }
          ]
        }
      })
    ]

    onCleanup(() => {
      for (const dispose of disposers) {
        dispose()
      }
    })
  },
  {
    immediate: true
  }
)

provideGuidedTutorial(guidedTutorial)
provideTutorial(tutorial)
</script>

<template>
  <slot />
</template>
