import { inject, provide } from 'vue'
import type { InjectionKey } from 'vue'

import type { Router } from 'vue-router'

import { getCourse, type Course } from '@/apis/course'
import { getCourseSeries, type CourseSeries } from '@/apis/course-series'

import type { GuidedTutorial } from './guided-tutorial'
type GuidedTutorialController = Pick<GuidedTutorial, 'startCourse' | 'endCurrentCourse'>

const tutorialKey: InjectionKey<Tutorial> = Symbol('tutorial')

export function useTutorial() {
  const tutorial = inject(tutorialKey)
  if (tutorial == null) throw new Error('Tutorial not provided')
  return tutorial
}

export function provideTutorial(tutorial: Tutorial) {
  provide(tutorialKey, tutorial)
}

export class Tutorial {
  constructor(
    private guidedTutorial: GuidedTutorialController,
    private router: Pick<Router, 'push'>,
    private loadCourse: (id: string) => Promise<Course> = getCourse,
    private loadCourseSeries: (id: string) => Promise<CourseSeries> = getCourseSeries
  ) {}

  async startCourse(courseSeriesID: string, courseID: string): Promise<void> {
    await this.endCurrentCourse()
    const [series, course] = await Promise.all([this.loadCourseSeries(courseSeriesID), this.loadCourse(courseID)])
    if (!series.courseIDs.includes(course.id)) throw new Error(`course ${course.id} is not in series ${series.id}`)

    if (course.kind === 'guided') {
      await this.guidedTutorial.startCourse(course, series)
      return
    }

    await this.router.push(`/course/${encodeURIComponent(series.id)}/${encodeURIComponent(course.id)}/playground`)
  }

  async endCurrentCourse(): Promise<void> {
    this.guidedTutorial.endCurrentCourse()
  }
}
