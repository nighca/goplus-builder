// export by github.com/goplus/ixgo/cmd/qexp

package tutorial

import (
	q "github.com/goplus/builder/tools/xgoexec/frameworks/tutorial"

	"go/constant"
	"reflect"

	"github.com/goplus/ixgo"
)

func init() {
	ixgo.RegisterPackage(&ixgo.Package{
		Name: "tutorial",
		Path: "github.com/goplus/builder/tools/xgoexec/frameworks/tutorial",
		Deps: map[string]string{
			"github.com/goplus/builder/tools/xgoexec/core": "core",
			"github.com/goplus/ixgo/xgobuild":              "xgobuild",
			"github.com/goplus/mod/modfile":                "modfile",
		},
		Interfaces: map[string]reflect.Type{
			"CourseProto": reflect.TypeOf((*q.CourseProto)(nil)).Elem(),
		},
		NamedTypes: map[string]reflect.Type{
			"Binding": reflect.TypeOf((*q.Binding)(nil)).Elem(),
			"Course":  reflect.TypeOf((*q.Course)(nil)).Elem(),
		},
		AliasTypes: map[string]reflect.Type{},
		Vars:       map[string]reflect.Value{},
		Funcs: map[string]reflect.Value{
			"Gopt_Course_Main": reflect.ValueOf(q.Gopt_Course_Main),
		},
		TypedConsts: map[string]ixgo.TypedConst{},
		UntypedConsts: map[string]ixgo.UntypedConst{
			"GopPackage": {Typ: "untyped bool", Value: constant.MakeBool(bool(q.GopPackage))},
			"Name":       {Typ: "untyped string", Value: constant.MakeString(string(q.Name))},
		},
	})
}
