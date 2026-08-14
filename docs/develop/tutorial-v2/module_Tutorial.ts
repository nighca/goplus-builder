import type { Course, CourseSeries } from "./module_CourseApis";

/** Coordinates course selection and delegates behavior to the matching driver. */
export interface Tutorial {
  readonly currentCourse: Course | null;
  readonly currentSeries: CourseSeries | null;
  /** Starts one Course, loading opaque Playground content through the framework contract. */
  startCourse(course: Course, series: CourseSeries | null): Promise<void>;
  /** Walks a Course Series using the supplied Course snapshots. */
  startCourseSeries(series: CourseSeries, courses: Course[]): Promise<void>;
  endCurrentCourse(): Promise<void>;
}
