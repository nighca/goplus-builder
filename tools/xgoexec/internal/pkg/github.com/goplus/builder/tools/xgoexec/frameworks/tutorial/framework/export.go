// export by github.com/goplus/ixgo/cmd/qexp

package tutorial

import (
	q "github.com/goplus/builder/tools/xgoexec/frameworks/tutorial/framework"

	"go/constant"
	"reflect"

	"github.com/goplus/ixgo"
)

func init() {
	ixgo.RegisterPackage(&ixgo.Package{
		Name: "tutorial",
		Path: "github.com/goplus/builder/tools/xgoexec/frameworks/tutorial/framework",
		Deps: map[string]string{
			"encoding/json": "json",
			"fmt":           "fmt",
			"github.com/goplus/builder/tools/xgoexec/core": "core",
		},
		Interfaces: map[string]reflect.Type{
			"CourseProto": reflect.TypeOf((*q.CourseProto)(nil)).Elem(),
		},
		NamedTypes: map[string]reflect.Type{
			"Course": reflect.TypeOf((*q.Course)(nil)).Elem(),
		},
		AliasTypes: map[string]reflect.Type{},
		Vars:       map[string]reflect.Value{},
		Funcs: map[string]reflect.Value{
			"Gopt_Course_Main": reflect.ValueOf(q.Gopt_Course_Main),
		},
		TypedConsts: map[string]ixgo.TypedConst{},
		UntypedConsts: map[string]ixgo.UntypedConst{
			"GopPackage": {Typ: "untyped bool", Value: constant.MakeBool(bool(q.GopPackage))},
		},
	})
}
