//go:build js && wasm

package main

import (
	"strings"
	"syscall/js"

	"github.com/goplus/builder/tools/xgoexec/tutorial"
	"github.com/goplus/ixgo/xgobuild"
	"github.com/goplus/mod/modfile"
)

type tutorialFramework struct{}

func (tutorialFramework) Configure() error {
	xgobuild.RegisterProject(&modfile.Project{Ext: "_course.gox", Class: "Course", PkgPaths: []string{"github.com/goplus/builder/tools/xgoexec/tutorial"}})
	tutorial.SetShowMessage(func(content string) { js.Global().Call("xbuilder_xgoexec_capability", "showMessage", content) })
	return nil
}

func (tutorialFramework) Transform(source []byte) []byte {
	return []byte(strings.Replace(string(source), "new(Course).Main()", "new(Course).MainEntry()", 1))
}
