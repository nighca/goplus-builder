//go:build js && wasm

package main

type Framework interface {
	Configure() error
	Transform(source []byte) []byte
}

var frameworks = map[string]Framework{
	"tutorial": tutorialFramework{},
}
