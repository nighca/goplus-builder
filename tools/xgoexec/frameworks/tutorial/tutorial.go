package tutorial

import "github.com/goplus/builder/tools/xgoexec/core"

const (
	GopPackage = true
	Name       = "tutorial"
)

type Course struct {
	onStart func()
}

type CourseProto interface {
	MainEntry()
	Start()
}

func (p *Course) OnStart(handler func()) { p.onStart = handler }

func (p *Course) Start() {
	if p.onStart != nil {
		p.onStart()
	}
}

func (p *Course) ShowMessage(content string) { core.CallCapability("showMessage", content) }

func Gopt_Course_Main(course CourseProto) {
	course.MainEntry()
	course.Start()
}
