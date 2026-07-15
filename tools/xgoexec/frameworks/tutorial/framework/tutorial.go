package tutorial

import "github.com/goplus/builder/tools/xgoexec/core"

const GopPackage = true

type Course struct {
	onStart func()
}

type CourseProto interface {
	MainEntry()
	Start()
}

type messageRequest struct {
	Content string `json:"content"`
}

type codeResult struct {
	Code string `json:"code"`
}

type submissionResult struct {
	Submission string `json:"submission"`
}

type progressRequest struct {
	Completed int `json:"completed"`
	Total     int `json:"total"`
}

func (p *Course) OnStart(handler func()) { p.onStart = handler }

func (p *Course) Start() {
	if p.onStart != nil {
		p.onStart()
	}
}

func (p *Course) ShowMessage(content string) {
	mustCallCapability("showMessage", messageRequest{Content: content}, nil)
}

func (p *Course) ReadCode() string {
	var result codeResult
	mustCallCapability("readCode", nil, &result)
	return result.Code
}

func (p *Course) WaitForSubmit() string {
	var result submissionResult
	mustCallCapability("waitForSubmit", nil, &result)
	return result.Submission
}

func (p *Course) SetProgress(completed, total int) {
	mustCallCapability("setProgress", progressRequest{Completed: completed, Total: total}, nil)
}

func Gopt_Course_Main(course CourseProto) {
	course.MainEntry()
	course.Start()
}

func mustCallCapability(name string, request, result any) {
	if err := core.CallCapability(name, request, result); err != nil {
		panic(err)
	}
}
