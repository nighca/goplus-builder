import type { Course, CourseSeries } from "./module_CourseApis";

/** Owns Course lifecycle; kind-specific behavior remains internal. */
export interface Tutorial {
  readonly currentCourse: Course | null;
  readonly currentSeries: CourseSeries | null;
  /** Starts one loaded Course. Playground editor composition remains caller-owned. */
  startCourse(course: Course, series: CourseSeries | null): Promise<void>;
  /** Walks a Course Series using the supplied Course snapshots. */
  startCourseSeries(series: CourseSeries, courses: Course[]): Promise<void>;
  endCurrentCourse(): Promise<void>;
}
