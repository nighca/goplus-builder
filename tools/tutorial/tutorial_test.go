package tutorial

import (
	"testing"

	"github.com/goplus/builder/tools/xgoexec"
)

func TestRuntimeOnLog(t *testing.T) {
	var got string
	new(Runtime).OnLog(func(log string) { got = log })
	if err := xgoexec.DispatchEvent("editor.runtime.log", []byte(`{"log":"hello"}`)); err != nil {
		t.Fatal(err)
	}
	if got != "hello" {
		t.Errorf("log = %q, want %q", got, "hello")
	}
}
