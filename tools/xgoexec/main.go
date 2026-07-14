//go:build js && wasm

package main

import (
	"syscall/js"

	"github.com/goplus/builder/tools/xgoexec/core"
	"github.com/goplus/builder/tools/xgoexec/frameworks/tutorial"
)

var runtime = core.NewRuntime(
	map[string]core.Framework{tutorial.Name: tutorial.Binding{}},
	func(phase, message string) { js.Global().Call("xbuilder_xgoexec_error", phase, message) },
)

func init() {
	js.Global().Set("xbuilder_xgoexec_configure", js.FuncOf(configure))
	js.Global().Set("xbuilder_xgoexec_build", js.FuncOf(build))
	js.Global().Set("xbuilder_xgoexec_run", js.FuncOf(run))
	js.Global().Set("xbuilder_xgoexec_stop", js.FuncOf(stop))
}

func configure(this js.Value, args []js.Value) any {
	name := ""
	if len(args) > 0 {
		name = args[0].String()
	}
	if err := runtime.Configure(name); err != nil {
		return jsError(err.Error())
	}
	return nil
}

func build(this js.Value, args []js.Value) any {
	if len(args) == 0 {
		return jsError("missing files")
	}
	files := map[string][]byte{}
	keys := js.Global().Get("Object").Call("keys", args[0])
	for i := 0; i < keys.Length(); i++ {
		name := keys.Index(i).String()
		value := args[0].Get(name)
		data := make([]byte, value.Length())
		js.CopyBytesToGo(data, value)
		files[name] = data
	}
	if err := runtime.Build(files); err != nil {
		return jsError(err.Error())
	}
	return nil
}

func run(this js.Value, args []js.Value) any {
	if err := runtime.Run(); err != nil {
		return jsError(err.Error())
	}
	return nil
}

func stop(this js.Value, args []js.Value) any {
	runtime.Stop()
	return nil
}

func jsError(message string) any { return js.Global().Get("Error").New(message) }

func main() { select {} }
