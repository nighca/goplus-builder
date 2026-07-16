//go:build js && wasm

package core

import "syscall/js"

func dispatchCapabilityCall(id uint64, name, request string) error {
	js.Global().Call("xbuilder_xgoexec_capability_call", id, name, request)
	return nil
}
