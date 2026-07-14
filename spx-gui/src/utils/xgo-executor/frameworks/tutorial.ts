import type { XGoFramework } from '../core/executor'

export function createTutorialFramework(showMessage: (content: string) => void): XGoFramework {
  return { name: 'tutorial', capabilities: { showMessage } }
}
