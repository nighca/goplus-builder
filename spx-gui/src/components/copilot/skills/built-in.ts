import { getSpxProjectSkillFiles, spxProjectSkillName } from '@/utils/spx/skill'
import { fromText, type Files } from '@/models/common/file'
import { InMemorySkillRegistry } from './registry'
import type { SkillBundle, SkillRegistry } from './types'

export const skillSpxProject = spxProjectSkillName
export const skillXgoLanguage = 'xgo-language'

const builtInSkills = [skillSpxProject, skillXgoLanguage]

const bundleFiles = import.meta.glob(
  './bundles/**/*.md', // For now we only bundle markdown resources from built-in skills.
  {
    eager: true,
    query: '?raw',
    import: 'default'
  }
) as Record<string, string>

function getBuiltInSkillFiles(name: string): Record<string, string> {
  if (name === skillSpxProject) return getSpxProjectSkillFiles()

  const files: Record<string, string> = {}
  const pathPrefix = `./bundles/${name}/`
  for (const path of Object.keys(bundleFiles).sort()) {
    if (!path.startsWith(pathPrefix)) continue
    files[path.slice(pathPrefix.length)] = bundleFiles[path]
  }
  return files
}

function createBuiltInSkillBundle(name: string): SkillBundle {
  const files: Files = {}
  for (const [filePath, content] of Object.entries(getBuiltInSkillFiles(name))) {
    files[filePath] = fromText(filePath, content)
  }
  return { files }
}

export function createBuiltInSkillRegistry(): SkillRegistry {
  const registry = new InMemorySkillRegistry()
  for (const name of builtInSkills) {
    const bundle = createBuiltInSkillBundle(name)
    registry.register(bundle)
  }
  return registry
}
