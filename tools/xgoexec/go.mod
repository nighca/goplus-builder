module github.com/goplus/builder/tools/xgoexec

go 1.25.0

tool github.com/goplus/ixgo/cmd/qexp

require (
	github.com/goplus/builder/tools/xgoexec/tutorial v0.0.0
	github.com/goplus/ixgo v1.1.0
	github.com/goplus/mod v0.20.2
)

require (
	github.com/goplus/gogen v1.23.0-pre.3.0.20260414234848-6641c10c9d6f // indirect
	github.com/goplus/reflectx v1.7.0 // indirect
	github.com/goplus/xgo v1.7.2-0.20260414235301-df19f4a1b7c2 // indirect
	github.com/qiniu/x v1.17.0 // indirect
	github.com/timandy/routine v1.1.5 // indirect
	github.com/visualfc/funcval v0.1.4 // indirect
	github.com/visualfc/xtype v0.3.0 // indirect
	golang.org/x/mod v0.29.0 // indirect
	golang.org/x/tools v0.38.0 // indirect
)

replace github.com/goplus/builder/tools/xgoexec/tutorial => ./tutorial
