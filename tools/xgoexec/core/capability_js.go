//go:build js && wasm

package core

import "syscall/js"

func CallCapability(name, content string) {
	js.Global().Call("xbuilder_xgoexec_capability", name, content)
}
