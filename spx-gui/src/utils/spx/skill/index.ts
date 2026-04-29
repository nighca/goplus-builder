export const spxProjectSkillName = 'spx-project'

let spxProjectKnowledgePromise: Promise<string> | null = null

const skillFiles = import.meta.glob('./**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as Record<string, string>

export function getSpxProjectSkillFiles(): Record<string, string> {
  const files: Record<string, string> = {}
  for (const path of Object.keys(skillFiles).sort()) {
    files[path.slice('./'.length)] = skillFiles[path]
  }
  return files
}

function getSkillBody(content: string) {
  if (!content.startsWith('---\n')) return content.trim()
  const frontmatterEnd = content.indexOf('\n---\n', 4)
  if (frontmatterEnd < 0) return content.trim()
  return content.slice(frontmatterEnd + '\n---\n'.length).trim()
}

export function getSpxProjectKnowledge(): Promise<string> {
  if (spxProjectKnowledgePromise != null) return spxProjectKnowledgePromise
  spxProjectKnowledgePromise = (async () => {
    const files = getSpxProjectSkillFiles()
    const instructions = getSkillBody(files['SKILL.md'])
    const resourceContents = Object.entries(files)
      .filter(([path]) => path !== 'SKILL.md')
      .map(([path, content]) => `# ${path}\n\n${content}`)
    return [instructions, ...resourceContents].join('\n\n')
  })().catch((error: unknown) => {
    spxProjectKnowledgePromise = null
    throw error
  })
  return spxProjectKnowledgePromise
}
