//go:build !js || !wasm

package core

import "fmt"

func dispatchCapabilityCall(id uint64, name, request string) error {
	return fmt.Errorf("capability %q is only available in js/wasm", name)
}
