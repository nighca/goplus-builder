//go:build js && wasm

package main

import (
	"context"
	"fmt"
	"io/fs"
	"path"
	"strings"
	"sync"
	"syscall/js"

	"github.com/goplus/ixgo"
	"github.com/goplus/ixgo/xgobuild"
)

var state struct {
	sync.Mutex
	ctx       *ixgo.Context
	interp    *ixgo.Interp
	cancel    context.CancelFunc
	framework Framework
}

func init() {
	js.Global().Set("xbuilder_xgoexec_configure", js.FuncOf(configure))
	js.Global().Set("xbuilder_xgoexec_build", js.FuncOf(build))
	js.Global().Set("xbuilder_xgoexec_run", js.FuncOf(run))
	js.Global().Set("xbuilder_xgoexec_stop", js.FuncOf(stop))
}

func configure(this js.Value, args []js.Value) any {
	state.Lock()
	defer state.Unlock()
	if state.ctx != nil {
		return jsError("already configured")
	}
	ctx := ixgo.NewContext(ixgo.SupportMultipleInterp | xgobuild.StaticLoad)
	ctx.SetPanic(func(info *ixgo.PanicInfo) { js.Global().Call("xbuilder_xgoexec_error", "runtime", info.Error.Error()) })
	ctx.Loader.Import("fmt")
	ctx.Loader.Import("time")
	if len(args) > 0 {
		framework, ok := frameworks[args[0].String()]
		if !ok {
			return jsError("unknown framework: " + args[0].String())
		}
		if err := framework.Configure(); err != nil {
			return jsError(err.Error())
		}
		state.framework = framework
	}
	state.ctx = ctx
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
	state.Lock()
	defer state.Unlock()
	if state.ctx == nil {
		return jsError("not configured")
	}
	source, err := xgobuild.BuildFSDir(state.ctx, mapFS(files), ".")
	if err != nil {
		return jsError(err.Error())
	}
	if state.framework != nil {
		source = state.framework.Transform(source)
	}
	pkg, err := state.ctx.LoadFile("main.go", source)
	if err != nil {
		return jsError(err.Error())
	}
	interp, err := state.ctx.NewInterp(pkg)
	if err != nil {
		return jsError(err.Error())
	}
	state.interp = interp
	return nil
}

func run(this js.Value, args []js.Value) any {
	state.Lock()
	if state.ctx == nil || state.interp == nil {
		state.Unlock()
		return jsError("not built")
	}
	ctx, interp := state.ctx, state.interp
	runCtx, cancel := context.WithCancel(context.Background())
	state.cancel = cancel
	state.Unlock()
	go func() {
		ctx.RunContext = runCtx
		_, err := ctx.RunInterp(interp, "main.go", nil)
		if err != nil && runCtx.Err() == nil {
			js.Global().Call("xbuilder_xgoexec_error", "runtime", err.Error())
		}
	}()
	return nil
}

func stop(this js.Value, args []js.Value) any {
	state.Lock()
	defer state.Unlock()
	if state.cancel != nil {
		state.cancel()
		state.cancel = nil
	}
	return nil
}
func jsError(message string) any { return js.Global().Get("Error").New(message) }

type mapFS map[string][]byte

func (p mapFS) ReadFile(name string) ([]byte, error) {
	value, ok := p[name]
	if !ok {
		return nil, fs.ErrNotExist
	}
	return value, nil
}
func (p mapFS) ReadDir(dirname string) ([]fs.DirEntry, error) {
	prefix := ""
	if dirname != "." {
		prefix = dirname + "/"
	}
	entries := map[string]bool{}
	for filename := range p {
		if !strings.HasPrefix(filename, prefix) {
			continue
		}
		name := strings.TrimPrefix(filename, prefix)
		if i := strings.IndexByte(name, '/'); i >= 0 {
			entries[name[:i]] = true
		} else {
			entries[name] = false
		}
	}
	result := make([]fs.DirEntry, 0, len(entries))
	for name, isDir := range entries {
		result = append(result, mapDirEntry{name: name, dir: isDir})
	}
	return result, nil
}
func (p mapFS) Join(elem ...string) string          { return path.Join(elem...) }
func (p mapFS) Base(filename string) string         { return path.Base(filename) }
func (p mapFS) Abs(filename string) (string, error) { return path.Join("/", filename), nil }

type mapDirEntry struct {
	name string
	dir  bool
}

func (p mapDirEntry) Name() string { return p.name }
func (p mapDirEntry) IsDir() bool  { return p.dir }
func (p mapDirEntry) Type() fs.FileMode {
	if p.dir {
		return fs.ModeDir
	}
	return 0
}
func (p mapDirEntry) Info() (fs.FileInfo, error) { return nil, fmt.Errorf("not implemented") }

func main() { select {} }
