/**
 * @desc AI description generation APIs of spx-backend
 */

import { client } from './common'

export type AIDescriptionKnowledgeBase = {
  spx: string
}

export async function generateAIDescription(
  content: string,
  knowledgeBase: AIDescriptionKnowledgeBase,
  signal?: AbortSignal
) {
  const result = (await client.post('/ai/description', { content, knowledgeBase }, { signal, timeout: 60 * 1000 })) as {
    description: string
  }
  return result.description
}
