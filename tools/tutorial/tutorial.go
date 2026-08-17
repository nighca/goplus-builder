// Package tutorial is the placeholder Tutorial class framework.
//
// It supplies the class entry convention plus minimal capability and event APIs
// for executor validation. Course APIs and host interactions beyond these are
// deliberately deferred to follow-up issues.
package tutorial

import (
	"encoding/json"
	"fmt"

	"github.com/goplus/builder/tools/xgoexec"
)

const XGoPackage = true

type Course struct {
	Editor  Editor
	onStart func()
}

type Editor struct {
	Runtime Runtime
}

type Runtime struct {
	onLog func(string)
	logs  chan string
}

type CourseProto interface {
	MainEntry()
	Start()
}

type messageRequest struct {
	Content string `json:"content"`
}

type runtimeLogEvent struct {
	Log string `json:"log"`
}

func (p *Course) OnStart(handler func()) { p.onStart = handler }

func (p *Runtime) OnLog(handler func(string)) {
	p.onLog = handler
	p.logs = make(chan string, 1)
	xgoexec.RegisterEventHandler("editor.runtime.log", func(payload json.RawMessage) error {
		var event runtimeLogEvent
		if err := json.Unmarshal(payload, &event); err != nil {
			return err
		}
		select {
		case p.logs <- event.Log:
			return nil
		default:
			return fmt.Errorf("runtime log event queue is full")
		}
	})
}

func (p *Course) ShowMessage(content string) {
	mustCallCapability("course_showMessage", messageRequest{Content: content}, nil)
}

func (p *Course) Start() {
	if p.onStart != nil {
		p.onStart()
	}
	runtime := &p.Editor.Runtime
	if runtime.onLog == nil {
		return
	}
	for {
		runtime.onLog(<-runtime.logs)
	}
}

func Gopt_Course_Main(course CourseProto) {
	course.MainEntry()
	course.Start()
}

func mustCallCapability(name string, request, result any) {
	if err := xgoexec.CallCapability(name, request, result); err != nil {
		panic(err)
	}
}
