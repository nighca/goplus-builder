package main

//go:generate go tool qexp -outdir internal/pkg github.com/goplus/builder/tools/xgoexec/frameworks/tutorial

import (
	_ "github.com/goplus/builder/tools/xgoexec/internal/pkg/github.com/goplus/builder/tools/xgoexec/frameworks/tutorial"
	_ "github.com/goplus/ixgo/pkg/time"
)
