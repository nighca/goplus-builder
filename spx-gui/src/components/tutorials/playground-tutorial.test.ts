import { describe, expect, it, vi } from 'vitest'

import type { PlaygroundCourseData } from '@/apis/course'
import type { CourseSeries } from '@/apis/course-series'
import { TutorialProject } from '@/models/tutorial/project'

import { PlaygroundTutorial } from './playground-tutorial'

function makeCourse(): PlaygroundCourseData {
  return {
    id: 'course / 1',
    owner: 'owner',
    kind: 'playground',
    title: 'Playground',
    thumbnail: '',
    content: {}
  }
}

function makeSeries(): CourseSeries {
  return {
    id: 'series / 1',
    owner: 'owner',
    title: 'Series',
    thumbnail: '',
    description: '',
    courseIDs: ['course / 1'],
    order: 1,
    createdAt: '',
    updatedAt: ''
  }
}

function makeProject() {
  const project = new TutorialProject()
  project.config = {
    project: { type: 'spx', root: 'project' },
    inEditorRoute: '/sprites/Bird/code',
    copilotContext: ''
  }
  return project
}

describe('PlaygroundTutorial', () => {
  it('publishes one loaded project and resolves after navigation', async () => {
    const course = makeCourse()
    const series = makeSeries()
    const project = makeProject()
    let finishNavigation: () => void = () => {}
    const push = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishNavigation = resolve
        })
    )
    const tutorial = new PlaygroundTutorial({ push }, vi.fn().mockResolvedValue(project))

    const starting = tutorial.startCourse(course, series)
    await vi.waitFor(() => expect(tutorial.currentEntry?.project).toBe(project))
    let resolved = false
    starting.then(() => {
      resolved = true
    })

    await Promise.resolve()
    expect(resolved).toBe(false)
    expect(push).toHaveBeenCalledWith('/course/series%20%2F%201/course%20%2F%201/playground/sprites/Bird/code')

    finishNavigation()
    await starting
    expect(resolved).toBe(true)
  })

  it('clears the memory-only entry without navigating', async () => {
    const project = makeProject()
    const dispose = vi.spyOn(project.project, 'dispose')
    const push = vi.fn().mockResolvedValue(undefined)
    const tutorial = new PlaygroundTutorial({ push }, vi.fn().mockResolvedValue(project))
    await tutorial.startCourse(makeCourse(), makeSeries())

    await tutorial.endCurrentCourse()

    expect(tutorial.currentEntry).toBeNull()
    expect(push).toHaveBeenCalledOnce()
    expect(dispose).toHaveBeenCalledOnce()
  })

  it('disposes a loaded project when navigation fails', async () => {
    const project = makeProject()
    const dispose = vi.spyOn(project.project, 'dispose')
    const tutorial = new PlaygroundTutorial(
      { push: vi.fn().mockRejectedValue(new Error('navigation failed')) },
      vi.fn().mockResolvedValue(project)
    )

    await expect(tutorial.startCourse(makeCourse(), makeSeries())).rejects.toThrow('navigation failed')

    expect(tutorial.currentEntry).toBeNull()
    expect(dispose).toHaveBeenCalledOnce()
  })
})
