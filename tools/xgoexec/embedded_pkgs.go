package main

//go:generate go tool qexp -outdir internal/pkg github.com/goplus/builder/tools/xgoexec/frameworks/tutorial/framework

// These blank imports register executable package implementations with ixgo.
// The standard-library entries must stay aligned with core.StandardPackages.
import (
	_ "github.com/goplus/builder/tools/xgoexec/internal/pkg/github.com/goplus/builder/tools/xgoexec/frameworks/tutorial/framework"
	_ "github.com/goplus/ixgo/pkg/fmt"
	_ "github.com/goplus/ixgo/pkg/time"
)
