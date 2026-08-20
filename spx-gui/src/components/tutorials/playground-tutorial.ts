import { inject, nextTick, provide, shallowRef } from 'vue'
import type { InjectionKey } from 'vue'
import type { Router } from 'vue-router'

import type { PlaygroundCourseData } from '@/apis/course'
import type { CourseSeries } from '@/apis/course-series'
import { TutorialProject } from '@/models/tutorial/project'

export type PlaygroundCourseEntry = {
  key: number
  series: CourseSeries
  course: PlaygroundCourseData
  project: TutorialProject
}

const playgroundTutorialKey: InjectionKey<PlaygroundTutorial> = Symbol('playground-tutorial')

export function usePlaygroundTutorial() {
  const tutorial = inject(playgroundTutorialKey)
  if (tutorial == null) throw new Error('PlaygroundTutorial not provided')
  return tutorial
}

export function providePlaygroundTutorial(tutorial: PlaygroundTutorial) {
  provide(playgroundTutorialKey, tutorial)
}

export function getCoursePlaygroundRoute(seriesID: string, courseID: string, inEditorRoute: string) {
  const base = `/course/${encodeURIComponent(seriesID)}/${encodeURIComponent(courseID)}/playground`
  const path = inEditorRoute.startsWith('/') ? inEditorRoute : `/${inEditorRoute}`
  return base + path
}

export class PlaygroundTutorial {
  private entryRef = shallowRef<PlaygroundCourseEntry | null>(null)
  private nextEntryKey = 0

  constructor(
    private router: Pick<Router, 'push'>,
    private loadProject: (course: PlaygroundCourseData) => Promise<TutorialProject> = TutorialProject.load
  ) {}

  get currentEntry() {
    return this.entryRef.value
  }

  async startCourse(course: PlaygroundCourseData, series: CourseSeries) {
    const project = await this.loadProject(course)
    const entry = { key: ++this.nextEntryKey, course, series, project }
    this.entryRef.value = entry
    try {
      const inEditorRoute = project.config?.inEditorRoute ?? ''
      await this.router.push(getCoursePlaygroundRoute(series.id, course.id, inEditorRoute))
    } catch (error) {
      if (this.entryRef.value === entry) this.entryRef.value = null
      project.project.dispose()
      throw error
    }
  }

  async endCurrentCourse() {
    const entry = this.entryRef.value
    this.entryRef.value = null
    await nextTick()
    entry?.project.project.dispose()
  }
}
