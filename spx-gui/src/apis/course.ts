import { client, type ByPage, type FileCollection, type PaginationParams } from './common'

export const courseTitleMaxLength = 200
/**
 * A prompt carries the lesson text together with its scaffold code, reference answer and
 * completion rules, so exercise and multi-sprite courses run several times longer than a plain
 * lesson. Kept in step with the API contract in `docs/openapi.yaml`.
 */
export const coursePromptMaxLength = 12000

export type CourseKind = 'guided' | 'playground'

export type CourseBase = {
  id: string
  owner: string
  kind: CourseKind
  title: string
  thumbnail: string
}

export type GuidedCourse = CourseBase & {
  kind: 'guided'
  content: {
    entrypoint: string
    prompt: string
  }
}

export type PlaygroundCourse = CourseBase & {
  kind: 'playground'
  content: FileCollection
}

export type Course = GuidedCourse | PlaygroundCourse

export function isGuidedCourse(course: Course): course is GuidedCourse {
  return course.kind === 'guided'
}

/** Get a course by ID */
export function getCourse(id: string, signal?: AbortSignal) {
  return client.get(`/courses/${encodeURIComponent(id)}`, undefined, { signal }) as Promise<Course>
}

export type GuidedCourseInput = Omit<GuidedCourse, 'id' | 'owner'>
export type PlaygroundCourseInput = Omit<PlaygroundCourse, 'id' | 'owner'>
export type CourseInput = GuidedCourseInput | PlaygroundCourseInput
export type CourseUpdate = Omit<GuidedCourseInput, 'kind'> | Omit<PlaygroundCourseInput, 'kind'>

export type GeneratePlaygroundCourseCopilotContextInput = {
  title: string
  thumbnail: string
  /** Current unsaved Course content. */
  content: FileCollection
}

export type GeneratePlaygroundCourseCopilotContextResult = {
  copilotContext: string
}

/** Generates an editable Copilot context for an unsaved Playground Course. */
export function generatePlaygroundCourseCopilotContext(
  params: GeneratePlaygroundCourseCopilotContextInput,
  signal?: AbortSignal
) {
  return client.post('/user/courses/playground/copilot-context', params, {
    signal
  }) as Promise<GeneratePlaygroundCourseCopilotContextResult>
}

/** Add a new course */
export function addCourse(params: CourseInput, signal?: AbortSignal) {
  return client.post('/user/courses', params, { signal }) as Promise<Course>
}

/** Update an existing course */
export function updateCourse(id: string, params: CourseUpdate, signal?: AbortSignal) {
  return client.patch(`/courses/${encodeURIComponent(id)}`, params, { signal }) as Promise<Course>
}

/** Delete a course */
export function deleteCourse(id: string) {
  return client.delete(`/courses/${encodeURIComponent(id)}`) as Promise<void>
}

export type ListCoursesParams = PaginationParams & {
  /** Filter courses by the course series ID */
  courseSeriesID?: string | null
  /** Field by which to order the results */
  orderBy?: 'createdAt' | 'updatedAt' | 'sequenceInCourseSeries'
  /** Order in which to sort the results */
  sortOrder?: 'asc' | 'desc'
}

export function listCourses(params?: ListCoursesParams, signal?: AbortSignal) {
  return client.get('/courses', params, { signal }) as Promise<ByPage<Course>>
}

export function listSignedInUserCourses(params?: ListCoursesParams, signal?: AbortSignal) {
  return client.get('/user/courses', params, { signal }) as Promise<ByPage<Course>>
}
