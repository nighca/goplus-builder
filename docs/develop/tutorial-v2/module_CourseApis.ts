import type { FileCollection } from "./base";

export type CourseKind = "guided" | "playground";

export type CourseBase = {
  id: string;
  owner: string;
  kind: CourseKind;
  title: string;
  thumbnail: string;
};

export type GuidedCourse = CourseBase & {
  kind: "guided";
  content: {
    entrypoint: string;
    prompt: string;
  };
};

export type GeneratePlaygroundCourseCopilotContextInput = {
  title: string;
  thumbnail: string;
  /** Current unsaved Course content. */
  content: FileCollection;
};

export type GeneratePlaygroundCourseCopilotContextResult = {
  copilotContext: string;
};

export type PlaygroundCourse = CourseBase & {
  kind: "playground";
  /** An opaque Tutorial-project file collection. */
  content: FileCollection;
};

export type Course = GuidedCourse | PlaygroundCourse;

export type CourseSeries = {
  id: string;
  owner: string;
  kind: CourseKind;
  title: string;
  thumbnail: string;
  description: string;
  courseIDs: string[];
  order: number;
};

export type GuidedCourseInput = Omit<GuidedCourse, "id" | "owner">;
export type PlaygroundCourseInput = Omit<PlaygroundCourse, "id" | "owner">;
export type CourseInput = GuidedCourseInput | PlaygroundCourseInput;
export type CourseUpdate =
  | Omit<GuidedCourseInput, "kind">
  | Omit<PlaygroundCourseInput, "kind">;
export type CourseSeriesInput = Omit<CourseSeries, "id" | "owner">;

export type ListCoursesParams = {
  courseSeriesID: string | null;
  pageIndex: number;
  pageSize: number;
};

export type ListCourseSeriesParams = {
  kind: CourseKind | null;
  pageIndex: number;
  pageSize: number;
};

export type ByPage<T> = {
  total: number;
  data: T[];
};

/** HTTP APIs provided by builder-backend for Course and Course Series data. */
export interface CourseApis {
  /** `POST /user/courses/playground/copilot-context`. Generates an editable context. */
  generatePlaygroundCourseCopilotContext(
    input: GeneratePlaygroundCourseCopilotContextInput,
    signal?: AbortSignal,
  ): Promise<GeneratePlaygroundCourseCopilotContextResult>;

  /** `GET /courses/{courseID}` */
  getCourse(id: string, signal?: AbortSignal): Promise<Course>;

  /** `GET /courses` */
  listCourses(
    params: ListCoursesParams,
    signal?: AbortSignal,
  ): Promise<ByPage<Course>>;

  /** `GET /user/courses` */
  listSignedInUserCourses(
    params: ListCoursesParams,
    signal?: AbortSignal,
  ): Promise<ByPage<Course>>;

  /** `POST /user/courses` */
  addCourse(input: CourseInput, signal?: AbortSignal): Promise<Course>;

  /** `PATCH /courses/{courseID}`. Course kind cannot be changed. */
  updateCourse(
    id: string,
    input: CourseUpdate,
    signal?: AbortSignal,
  ): Promise<Course>;

  /** `DELETE /courses/{courseID}` */
  deleteCourse(id: string, signal?: AbortSignal): Promise<void>;

  /** `GET /course-series/{courseSeriesID}` */
  getCourseSeries(id: string, signal?: AbortSignal): Promise<CourseSeries>;

  /** `GET /course-series` */
  listCourseSeries(
    params: ListCourseSeriesParams,
    signal?: AbortSignal,
  ): Promise<ByPage<CourseSeries>>;

  /** `GET /user/course-series` */
  listSignedInUserCourseSeries(
    params: ListCourseSeriesParams,
    signal?: AbortSignal,
  ): Promise<ByPage<CourseSeries>>;

  /** `POST /user/course-series` */
  addCourseSeries(
    input: CourseSeriesInput,
    signal?: AbortSignal,
  ): Promise<CourseSeries>;

  /** `PATCH /course-series/{courseSeriesID}` */
  updateCourseSeries(
    id: string,
    input: CourseSeriesInput,
    signal?: AbortSignal,
  ): Promise<CourseSeries>;

  /** `DELETE /course-series/{courseSeriesID}` */
  deleteCourseSeries(id: string, signal?: AbortSignal): Promise<void>;
}
