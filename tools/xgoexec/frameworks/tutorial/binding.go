package tutorial

import (
	"github.com/goplus/ixgo/xgobuild"
	"github.com/goplus/mod/modfile"
)

type Binding struct{}

func (Binding) Register() error {
	xgobuild.RegisterProject(&modfile.Project{Ext: "_course.gox", Class: "Course", PkgPaths: []string{"github.com/goplus/builder/tools/xgoexec/frameworks/tutorial"}})
	return nil
}
