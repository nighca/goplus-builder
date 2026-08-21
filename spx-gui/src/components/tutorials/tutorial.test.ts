import { describe, expect, it, vi } from 'vitest'

import type { GuidedCourse, PlaygroundCourse } from '@/apis/course'
import type { CourseSeries } from '@/apis/course-series'

import { Tutorial } from './tutorial'

function makeSeries(courseIDs = ['course-1']): CourseSeries {
  return {
    id: 'series-1',
    owner: 'owner',
    kind: 'guided',
    title: 'Series',
    thumbnail: '',
    description: '',
    courseIDs,
    order: 1
  }
}

function makeGuidedCourse(): GuidedCourse {
  return {
    id: 'course-1',
    owner: 'owner',
    kind: 'guided',
    title: 'Guided',
    thumbnail: '',
    content: { entrypoint: '/tutorials', prompt: 'Learn Builder' }
  }
}

function makePlaygroundCourse(): PlaygroundCourse {
  return {
    id: 'course-1',
    owner: 'owner',
    kind: 'playground',
    title: 'Playground',
    thumbnail: '',
    content: {}
  }
}

function makeControllers() {
  return {
    guided: {
      startCourse: vi.fn().mockResolvedValue(undefined),
      endCurrentCourse: vi.fn()
    },
    playground: {
      startCourse: vi.fn().mockResolvedValue(undefined),
      endCurrentCourse: vi.fn()
    }
  }
}

describe('Tutorial', () => {
  it('loads IDs and delegates Guided Course startup', async () => {
    const course = makeGuidedCourse()
    const series = makeSeries()
    const { guided, playground } = makeControllers()
    const loadCourse = vi.fn().mockResolvedValue(course)
    const loadSeries = vi.fn().mockResolvedValue(series)
    const tutorial = new Tutorial(guided, playground, loadCourse, loadSeries)

    await tutorial.startCourse(series.id, course.id)

    expect(loadCourse).toHaveBeenCalledWith(course.id)
    expect(loadSeries).toHaveBeenCalledWith(series.id)
    expect(guided.startCourse).toHaveBeenCalledWith(course, series)
    expect(playground.startCourse).not.toHaveBeenCalled()
  })

  it('constructs the Playground branch internally', async () => {
    const course = makePlaygroundCourse()
    const series = makeSeries()
    const { guided, playground } = makeControllers()
    const tutorial = new Tutorial(
      guided,
      playground,
      vi.fn().mockResolvedValue(course),
      vi.fn().mockResolvedValue(series)
    )

    await tutorial.startCourse(series.id, course.id)

    expect(playground.startCourse).toHaveBeenCalledWith(course, series)
    expect(guided.startCourse).not.toHaveBeenCalled()
  })

  it('ends both internal mechanisms before starting another Course', async () => {
    const course = makeGuidedCourse()
    const series = makeSeries()
    const { guided, playground } = makeControllers()
    const tutorial = new Tutorial(
      guided,
      playground,
      vi.fn().mockResolvedValue(course),
      vi.fn().mockResolvedValue(series)
    )

    await tutorial.startCourse(series.id, course.id)

    expect(guided.endCurrentCourse).toHaveBeenCalledOnce()
    expect(playground.endCurrentCourse).toHaveBeenCalledOnce()
    expect(guided.endCurrentCourse.mock.invocationCallOrder[0]).toBeLessThan(
      guided.startCourse.mock.invocationCallOrder[0]
    )
  })

  it('rejects a Course outside the requested Series', async () => {
    const course = makeGuidedCourse()
    const series = makeSeries(['another-course'])
    const { guided, playground } = makeControllers()
    const tutorial = new Tutorial(
      guided,
      playground,
      vi.fn().mockResolvedValue(course),
      vi.fn().mockResolvedValue(series)
    )

    await expect(tutorial.startCourse(series.id, course.id)).rejects.toThrow(
      `course ${course.id} is not in series ${series.id}`
    )
    expect(guided.startCourse).not.toHaveBeenCalled()
    expect(playground.startCourse).not.toHaveBeenCalled()
  })
})
