#!/bin/bash
set -e

export PATH=/usr/local/go/bin:$PATH

./build-wasm.sh
# Vercel may select pnpm 9 by default, which ignores our required pnpm 11 setup.
corepack pnpm@11.9.0 run build
