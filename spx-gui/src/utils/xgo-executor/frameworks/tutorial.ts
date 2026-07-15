import type { XGoFramework } from '../core/executor'

export type TutorialProgress = { completed: number; total: number }

export type TutorialCapabilities = {
  showMessage: (content: string) => void | Promise<void>
  readCode: () => string | Promise<string>
  waitForSubmit: () => string | Promise<string>
  setProgress: (progress: TutorialProgress) => void | Promise<void>
}

export function createTutorialFramework(capabilities: TutorialCapabilities): XGoFramework {
  return {
    name: 'tutorial',
    capabilities: {
      showMessage: (request) => capabilities.showMessage((request as { content: string }).content),
      readCode: async () => ({ code: await capabilities.readCode() }),
      waitForSubmit: async () => ({ submission: await capabilities.waitForSubmit() }),
      setProgress: (request) => capabilities.setProgress(request as TutorialProgress)
    }
  }
}
