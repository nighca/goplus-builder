import '@/assets/wasm/wasm_exec.js'

const wasmUrl = new URL('@/assets/wasm/xgoexec.wasm', import.meta.url).href

declare class Go { importObject: WebAssembly.Imports; run(instance: WebAssembly.Instance): Promise<void> }

type XGoExecutorGlobal = Window & {
  xbuilder_xgoexec_configure: (framework: string) => void
  xbuilder_xgoexec_build: (files: Record<string, Uint8Array>) => void
  xbuilder_xgoexec_run: () => void
  xbuilder_xgoexec_stop: () => void
  xbuilder_xgoexec_error: (phase: string, message: string) => void
  xbuilder_xgoexec_capability: (name: string, content: string) => void
}

export class XGoExecutor {
  private readonly target = window as XGoExecutorGlobal

  constructor(private framework: 'none' | 'tutorial', private onMessage: (content: string) => void) {}

  async run(files: Record<string, string>) {
    const go = new Go()
    const { instance } = await WebAssembly.instantiateStreaming(fetch(wasmUrl), go.importObject)
    const errors: string[] = []
    this.target.xbuilder_xgoexec_error = (phase, message) => errors.push(`${phase}: ${message}`)
    this.target.xbuilder_xgoexec_capability = (name, content) => {
      if (name !== 'showMessage') throw new Error(`unsupported capability: ${name}`)
      this.onMessage(content)
    }
    void go.run(instance)
    await new Promise((resolve) => window.setTimeout(resolve, 0))
    this.target.xbuilder_xgoexec_configure(this.framework)
    const encoded = Object.fromEntries(Object.entries(files).map(([path, content]) => [path, new TextEncoder().encode(content)]))
    this.target.xbuilder_xgoexec_build(encoded)
    if (errors.length > 0) throw new Error(errors.join('\n'))
    this.target.xbuilder_xgoexec_run()
  }

  stop() { this.target.xbuilder_xgoexec_stop() }
}
