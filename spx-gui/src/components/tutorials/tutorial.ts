import { inject, provide } from 'vue'
import type { InjectionKey } from 'vue'

import { getCourse, type Course, type PlaygroundCourseData } from '@/apis/course'
import { getCourseSeries, type CourseSeries } from '@/apis/course-series'

import type { GuidedTutorial } from './guided-tutorial'
import type { PlaygroundTutorial } from './playground-tutorial'

type CourseData = Course | PlaygroundCourseData

type GuidedTutorialController = Pick<GuidedTutorial, 'startCourse' | 'endCurrentCourse'>
type PlaygroundTutorialController = Pick<PlaygroundTutorial, 'startCourse' | 'endCurrentCourse'>

const tutorialKey: InjectionKey<Tutorial> = Symbol('tutorial')

export function useTutorial() {
  const tutorial = inject(tutorialKey)
  if (tutorial == null) throw new Error('Tutorial not provided')
  return tutorial
}

export function provideTutorial(tutorial: Tutorial) {
  provide(tutorialKey, tutorial)
}

function isPlaygroundCourse(course: CourseData): course is PlaygroundCourseData {
  return 'kind' in course && course.kind === 'playground'
}

export class Tutorial {
  constructor(
    private guidedTutorial: GuidedTutorialController,
    private playgroundTutorial: PlaygroundTutorialController,
    private loadCourse: (id: string) => Promise<CourseData> = getCourse,
    private loadCourseSeries: (id: string) => Promise<CourseSeries> = getCourseSeries
  ) {}

  async startCourse(courseSeriesID: string, courseID: string): Promise<void> {
    await this.endCurrentCourse()
    const [series, course] = await Promise.all([this.loadCourseSeries(courseSeriesID), this.loadCourse(courseID)])
    if (!series.courseIDs.includes(course.id)) throw new Error(`course ${course.id} is not in series ${series.id}`)

    if (isPlaygroundCourse(course)) {
      await this.playgroundTutorial.startCourse(course, series)
    } else {
      await this.guidedTutorial.startCourse(course, series)
    }
  }

  async endCurrentCourse(): Promise<void> {
    this.guidedTutorial.endCurrentCourse()
    this.playgroundTutorial.endCurrentCourse()
  }
}
