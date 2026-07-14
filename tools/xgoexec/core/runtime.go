package core

import (
	"context"
	"fmt"
	"sync"

	"github.com/goplus/ixgo"
	"github.com/goplus/ixgo/xgobuild"
)

type ErrorReporter func(phase, message string)

type Runtime struct {
	sync.Mutex
	ctx         *ixgo.Context
	interp      *ixgo.Interp
	cancel      context.CancelFunc
	frameworks  map[string]Framework
	reportError ErrorReporter
}

func NewRuntime(frameworks map[string]Framework, reportError ErrorReporter) *Runtime {
	return &Runtime{frameworks: frameworks, reportError: reportError}
}

func (p *Runtime) Configure(name string) error {
	p.Lock()
	defer p.Unlock()
	if p.ctx != nil {
		return fmt.Errorf("already configured")
	}
	if name != "" {
		framework, ok := p.frameworks[name]
		if !ok {
			return fmt.Errorf("unknown framework: %s", name)
		}
		if err := framework.Register(); err != nil {
			return err
		}
	}
	ctx := ixgo.NewContext(ixgo.SupportMultipleInterp | xgobuild.StaticLoad)
	ctx.SetPanic(func(info *ixgo.PanicInfo) { p.reportError("runtime", info.Error.Error()) })
	ctx.Loader.Import("fmt")
	ctx.Loader.Import("time")
	p.ctx = ctx
	return nil
}

func (p *Runtime) Build(files map[string][]byte) error {
	p.Lock()
	defer p.Unlock()
	if p.ctx == nil {
		return fmt.Errorf("not configured")
	}
	if p.cancel != nil {
		return fmt.Errorf("executor is running")
	}
	source, err := xgobuild.BuildFSDir(p.ctx, MapFS(files), ".")
	if err != nil {
		return err
	}
	pkg, err := p.ctx.LoadFile("main.go", source)
	if err != nil {
		return err
	}
	interp, err := p.ctx.NewInterp(pkg)
	if err != nil {
		return err
	}
	p.interp = interp
	return nil
}

func (p *Runtime) Run() error {
	p.Lock()
	if p.ctx == nil || p.interp == nil {
		p.Unlock()
		return fmt.Errorf("not built")
	}
	if p.cancel != nil {
		p.Unlock()
		return fmt.Errorf("executor is running")
	}
	ctx, interp := p.ctx, p.interp
	runCtx, cancel := context.WithCancel(context.Background())
	p.cancel = cancel
	p.Unlock()
	go func() {
		ctx.RunContext = runCtx
		_, err := ctx.RunInterp(interp, "main.go", nil)
		if err != nil && runCtx.Err() == nil {
			p.reportError("runtime", err.Error())
		}
		p.Lock()
		p.cancel = nil
		p.Unlock()
	}()
	return nil
}

func (p *Runtime) Stop() {
	p.Lock()
	defer p.Unlock()
	if p.cancel != nil {
		p.cancel()
	}
}
