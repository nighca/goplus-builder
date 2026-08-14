package tutorialbinding

import (
	"github.com/goplus/ixgo/xgobuild"
	"github.com/goplus/mod/modfile"
)

const Name = "tutorial"

// Binding describes Tutorial's XGo class-framework convention. The framework
// implementation is intentionally small for now; later Tutorial issues own
// its public API and runtime behavior.
type Binding struct{}

func (Binding) Register() error {
	xgobuild.RegisterProject(&modfile.Project{
		Ext:      "_course.gox",
		Class:    "Course",
		PkgPaths: []string{"github.com/goplus/builder/tools/tutorial/framework"},
	})
	return nil
}
