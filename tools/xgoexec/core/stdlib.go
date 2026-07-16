package core

// StandardPackages lists the standard packages visible to XGo compilation.
// Each package must also be linked into the WASM binary by a blank import in embedded_pkgs.go.
var StandardPackages = []string{
	"bytes",
	"encoding/json",
	"errors",
	"fmt",
	"io",
	"math",
	"math/rand",
	"sort",
	"strconv",
	"strings",
	"time",
}
