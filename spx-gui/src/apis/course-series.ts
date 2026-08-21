import { client, type ByPage, type PaginationParams } from './common'
import type { CourseKind } from './course'

export const courseSeriesTitleMaxLength = 200
export const courseSeriesDescriptionMaxLength = 400

export type CourseSeries = {
  /** Unique identifier */
  id: string
  /** Username of the course series's owner */
  owner: string
  kind: CourseKind
  /** Title of the course series */
  title: string
  /** Universal URL of the course series's thumbnail image */
  thumbnail: string
  /** Description of the course series */
  description: string
  /** Array of course IDs that included in this series */
  courseIDs: string[]
  /** Order/priority of the course series for sorting */
  order: number
}

/** Get a course series by ID */
export function getCourseSeries(id: string, signal?: AbortSignal) {
  return client.get(`/course-series/${encodeURIComponent(id)}`, undefined, { signal }) as Promise<CourseSeries>
}

export type CourseSeriesInput = Omit<CourseSeries, 'id' | 'owner'>

/** Add a new course series */
export function addCourseSeries(params: CourseSeriesInput, signal?: AbortSignal) {
  return client.post('/user/course-series', params, { signal }) as Promise<CourseSeries>
}

/** Update an existing course series */
export function updateCourseSeries(id: string, params: CourseSeriesInput, signal?: AbortSignal) {
  return client.patch(`/course-series/${encodeURIComponent(id)}`, params, { signal }) as Promise<CourseSeries>
}

/** Delete a course series */
export function deleteCourseSeries(id: string) {
  return client.delete(`/course-series/${encodeURIComponent(id)}`) as Promise<void>
}

export type ListCourseSeriesParams = PaginationParams & { kind: CourseKind | null }

export function listCourseSeries(params: ListCourseSeriesParams, signal?: AbortSignal) {
  return client.get('/course-series', params, { signal }) as Promise<ByPage<CourseSeries>>
}

export function listSignedInUserCourseSeries(params: ListCourseSeriesParams, signal?: AbortSignal) {
  return client.get('/user/course-series', params, { signal }) as Promise<ByPage<CourseSeries>>
}
