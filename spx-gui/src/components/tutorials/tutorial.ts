import { inject, provide } from 'vue'
import type { InjectionKey, Ref } from 'vue'
import type { Router } from 'vue-router'

import { timeout, localStorageRef, until } from '@/utils/utils'
import type { Copilot, Topic } from '@/components/copilot/copilot'
import { tagName as highlightLinkTagName } from '@/components/copilot/custom-elements/HighlightLink.vue'
import type { Course } from '@/apis/course'
import type { CourseSeries } from '@/apis/course-series'

import { name as tutorialStateIndicatorName } from './TutorialStateIndicator.vue'
import { tagName as tutorialCourseSuccessTagName } from './TutorialCourseSuccess.vue'

export type CourseSeriesWithCourses = CourseSeries & {
  courses: Course[]
}

const tutorialKey: InjectionKey<Tutorial> = Symbol('tutorial')

export function useTutorial() {
  const tutorial = inject(tutorialKey)
  if (tutorial == null) {
    throw new Error('Tutorial not provided')
  }
  return tutorial
}

export function provideTutorial(tutorial: Tutorial) {
  provide(tutorialKey, tutorial)
}

export type TutorialTopic = Topic & {
  isTutorialTopic: true
}

export function isTutorialTopic(topic: Topic): topic is TutorialTopic {
  return (topic as TutorialTopic).isTutorialTopic === true
}

export class Tutorial {
  private course = localStorageRef<Course | null>('spx-gui-tutorial-course', null)
  private series = localStorageRef<CourseSeriesWithCourses | null>('spx-gui-tutorial-series', null)

  constructor(
    private copilot: Copilot,
    private router: Router,
    private isRouteLoaded: Ref<boolean>
  ) {}

  get currentCourse(): Course | null {
    return this.course.value
  }

  get currentSeries(): CourseSeriesWithCourses | null {
    return this.series.value
  }

  async startCourse(course: Course, series: CourseSeriesWithCourses): Promise<void> {
    try {
      this.endCurrentCourse()
      this.course.value = course
      this.series.value = series

      const { entrypoint } = course

      if (entrypoint) {
        await this.router.push(entrypoint)
        await until(this.isRouteLoaded)
        await timeout(100) // Wait for detailed UI rendering
      }

      await this.copilot.startSession(this.generateTopic(course))

      this.copilot.notifyUserEvent(
        {
          en: 'Course Started',
          zh: '课程开始'
        },
        'Now the course has just started.'
      )
    } catch (error) {
      console.error('Failed to start course:', error)
      this.endCurrentCourse()
      throw error
    }
  }

  protected generateTopic(course: Course): TutorialTopic {
    const { id, title, prompt, references, entrypoint } = course
    return {
      isTutorialTopic: true,
      title: { en: title, zh: title },
      description: `\
You are assisting the user in learning the course: ${course.title}.

### Course Details

<course>
  <course-id>${id}</course-id>
  <course-title>${title}</course-title>
  <course-entrypoint>${entrypoint}</course-entrypoint>
  <course-prompt>
  ${prompt}
  </course-prompt>
  <course-references>
  ${references.map((ref) => `<project-reference>${ref.fullName}</project-reference>`).join('\n')}
  </course-references>
</course>

### Guidance

You will:

* Split the course into smaller steps & clearly define the course completion criteria in the first message.
* Guide the user through each step with short and clear instructions in following messages. Each message should focus on one step only.
* If all steps are completed according to the criteria, invoke a success dialog using <${tutorialCourseSuccessTagName} />.

When coding tasks are involved:

* If a project reference is available for the course, treat it as the standard answer.
* Before offering coding suggestions, ensure you know what the current code is. If not, use appropriate tools to review it first.
* Avoid giving complete solution code directly. Instead, guide the user step-by-step with hints and explanations.
* Prefer to insert code by dragging corresponding items (if available) from "API References" into the code editor over providing manual code snippets.
* If you found the user is navigated outside editor for the correct project, prompt them to return or suggest exiting the course if desired.

When tool result received:

* Skip repeating content already mentioned before.
* Continue with the chat before the corresponding tool use.

### Example

This is an example for messages between you and the user in a course:

- User event

  course started

- Copilot message

  Welcome to the course! In this course we will learn how to remove a project in XBuilder. We will cover the following steps:

  1. Go to page "my projects".
  2. Hover the first project in list and click the "Remove" in corner menu.
  3. Confirm the removal in the popup dialog.

  Now let's start with the first step.

  Please click <${highlightLinkTagName} target-id="DgdwNmp8" tip="Click to go to My projects">My projects</${highlightLinkTagName}> to go to the "my projects" page.

- User event

  navigated to /user/xxx/projects

- Copilot message

  Great! You are now on the "my projects" page. Please hover <${highlightLinkTagName} target-id="U41-JvCA" tip="Hover to see the corner menu">the first project in the list</${highlightLinkTagName}> and click the "Remove" in the corner menu.

- User event

  Opened modal

- Copilot message

  Please confirm the removal of the project by clicking <${highlightLinkTagName} target-id="U41-JvCA" tip="Click to confirm">the confirm button</${highlightLinkTagName}>.

- User event

  Success notification showed: Project removed successfully

- Copilot message

  Great job! You have successfully removed the project.

  <${tutorialCourseSuccessTagName} />

This is another example for messages between you and the user in a coding course:

- User event

  course started
  
- Copilot message

  Welcome to the course! In this course we will learn how to create a simple "Click to greet" game in XBuilder. We will cover the following steps:

  1. Select the sprite to add code to
  2. Add a \`onClick\` event handler
  3. Add a \`say\` statement in the handler
  4. Run the game to test it

  Now let's start with the first step.

  Please click <${highlightLinkTagName} target-id="sprite-list-0" tip="Click to select sprite A">sprite A</${highlightLinkTagName}> to select it.

- User event

  navigated to /editor/xxx/yyy/sprites/A/code

- Copilot message

  Great! You have selected sprite A. Now, please drag <highlight-link target-id="QrqsMfAK" tip="Drag into the code editor">onClick => {}</highlight-link> from the API References on the left into the code editor.

- User event

  I did what you asked.

- Copilot message

  Good! Now for the second step: we need to add a \`say\` statement inside the event handler. Please drag <highlight-link target-id="zKDF_slZ" tip="Drag into the code editor">say "Hi"</highlight-link> from the API References on the left and place it between the curly braces \`{}\` of your \`onStart\` event handler.

- User event

  I did what you asked.

- Copilot message

  Now for the final step: let's run the project to see the result! Please click the <highlight-link target-id="kfjzMaUu" tip="Click to run the project">Run button</highlight-link> to start the game. Then click on the sprite to see the greeting.

- User event

  Game exited with code 0.

- Copilot message

  Awesome! The game exited successfully. I can see your final code and it looks perfect.

  You have successfully created a simple "Click to greet" game. Well done!

  <${tutorialCourseSuccessTagName} />
`,
      reactToEvents: true,
      endable: false,
      stateIndicator: tutorialStateIndicatorName
    }
  }

  endCurrentCourse() {
    this.copilot.endCurrentSession()
    this.course.value = null
    this.series.value = null
  }
}
