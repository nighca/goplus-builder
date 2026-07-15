//go:build js && wasm

package core

import "syscall/js"

func dispatchCapability(id uint64, name, request string) error {
	js.Global().Call("xbuilder_xgoexec_capability", id, name, request)
	return nil
}
