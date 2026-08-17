// Package tutorial is the placeholder Tutorial class framework.
//
// It only supplies the class entry convention required by the executor. Course
// APIs and host interactions are deliberately deferred to follow-up issues.
package tutorial

const XGoPackage = true

type Course struct{}

type CourseProto interface {
	MainEntry()
	Start()
}

func (p *Course) Start() {}

func Gopt_Course_Main(course CourseProto) {
	course.MainEntry()
	course.Start()
}
