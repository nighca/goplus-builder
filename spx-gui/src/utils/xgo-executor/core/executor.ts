import '@/assets/wasm/wasm_exec.js'

const wasmUrl = new URL('@/assets/wasm/xgoexec.wasm', import.meta.url).href

declare class Go { importObject: WebAssembly.Imports; run(instance: WebAssembly.Instance): Promise<void> }

export type XGoFramework = { name: string; capabilities: Record<string, (content: string) => void> }
export type XGoExecutorOptions = { framework: XGoFramework | null; onError: (phase: string, message: string) => void }

type Target = Window & {
  xbuilder_xgoexec_configure: (framework: string) => Error | null
  xbuilder_xgoexec_build: (files: Record<string, Uint8Array>) => Error | null
  xbuilder_xgoexec_run: () => Error | null
  xbuilder_xgoexec_stop: () => Error | null
  xbuilder_xgoexec_error: (phase: string, message: string) => void
  xbuilder_xgoexec_capability: (name: string, content: string) => void
}

export class XGoExecutor {
  private readonly target = window as Target

  constructor(private options: XGoExecutorOptions) {}

  async run(files: Record<string, string>) {
    const go = new Go()
    const { instance } = await WebAssembly.instantiateStreaming(fetch(wasmUrl), go.importObject)
    const errors: string[] = []
    this.target.xbuilder_xgoexec_error = (phase, message) => {
      if (phase === 'runtime') {
        this.options.onError(phase, message)
        return
      }
      errors.push(`${phase}: ${message}`)
    }
    this.target.xbuilder_xgoexec_capability = (name, content) => this.options.framework?.capabilities[name]?.(content)
    void go.run(instance)
    const startedAt = Date.now()
    while (typeof this.target.xbuilder_xgoexec_configure !== 'function') {
      if (Date.now() - startedAt > 5000) throw new Error('timed out waiting for XGo executor')
      await new Promise((resolve) => window.setTimeout(resolve, 10))
    }
    throwIfError(this.target.xbuilder_xgoexec_configure(this.options.framework?.name ?? ''))
    throwIfError(this.target.xbuilder_xgoexec_build(encodeFiles(files)))
    if (errors.length > 0) throw new Error(errors.join('\n'))
    throwIfError(this.target.xbuilder_xgoexec_run())
  }

  stop() { throwIfError(this.target.xbuilder_xgoexec_stop()) }
}

function encodeFiles(files: Record<string, string>): Record<string, Uint8Array> {
  return Object.fromEntries(Object.entries(files).map(([path, content]) => [path, new TextEncoder().encode(content)]))
}

function throwIfError(error: Error | null) {
  if (error != null) throw error
}
