import { reactive } from 'vue'

import type { FileCollection } from '@/apis/common'
import { getFiles } from '@/models/common/cloud'
import { File, toConfig, type Files } from '@/models/common/file'
import { SpxProject } from '@/models/spx/project'

import { TutorialProjectLoadError } from './common'
import { TutorialVideo, tutorialVideoAssetPath } from './video'

const indexFilePath = 'index.json'
const programFilePath = 'main.gox'

export type TutorialProjectIndex = {
  project: {
    type: 'spx'
    root: string
  }
  inEditorRoute: string
  copilotContext: string
}

export { TutorialProjectLoadError } from './common'
export { TutorialVideo } from './video'

export class TutorialProject {
  private constructor(
    readonly index: TutorialProjectIndex,
    readonly program: File,
    readonly videos: TutorialVideo[],
    private readonly files: Files
  ) {
    return reactive(this) as this
  }

  static async fromFileCollection(fileCollection: FileCollection) {
    return this.fromFiles(getFiles(fileCollection))
  }

  static async fromFiles(files: Files): Promise<TutorialProject> {
    const clonedFiles = await cloneFiles(files)
    const index = await loadIndex(clonedFiles)
    const program = requireFile(clonedFiles, programFilePath)
    const projectFiles = extractDirectory(clonedFiles, index.project.root)
    requireFile(projectFiles, 'assets/index.json')
    const videos = await TutorialVideo.loadAll(clonedFiles)
    const project = new TutorialProject(index, program, videos, clonedFiles)
    videos.forEach((video) => video.setProject(project))
    return project
  }

  getVideo(name: string) {
    return this.videos.find((video) => video.name === name) ?? null
  }

  getVideoById(id: string) {
    return this.videos.find((video) => video.id === id) ?? null
  }

  addVideo(video: TutorialVideo) {
    if (this.getVideo(video.name) != null) throw new Error(`video ${video.name} already exists`)
    video.setProject(this)
    this.videos.push(video)
  }

  removeVideo(id: string) {
    const index = this.videos.findIndex((video) => video.id === id)
    if (index < 0) throw new Error(`video ${id} not found`)
    const [video] = this.videos.splice(index, 1)
    video.setProject(null)
  }

  async createSpxProject() {
    const project = new SpxProject()
    await project.loadFiles(await cloneFiles(extractDirectory(this.files, this.index.project.root)))
    return project
  }

  async clone() {
    return TutorialProject.fromFiles(await this.exportFiles())
  }

  async exportFiles(project: SpxProject | null = null) {
    const files = await cloneFiles(this.files)
    for (const path of Object.keys(files)) {
      if (path.startsWith(`${tutorialVideoAssetPath}/`)) delete files[path]
    }
    Object.assign(files, ...this.videos.map((video) => video.clone(true).export()))
    if (project == null) return files
    Object.assign(files, prefixFiles(await cloneFiles(project.exportFiles()), this.index.project.root))
    return files
  }
}

async function loadIndex(files: Files): Promise<TutorialProjectIndex> {
  const rawIndex = await parseConfig(requireFile(files, indexFilePath), indexFilePath)
  const project = asRecord(rawIndex.project, 'index.json project')
  if (project.type !== 'spx') throw new TutorialProjectLoadError('index.json project type must be "spx"')
  if (!isRelativeDirectory(project.root))
    throw new TutorialProjectLoadError('index.json project root must be a relative directory')
  if (typeof rawIndex.inEditorRoute !== 'string')
    throw new TutorialProjectLoadError('index.json inEditorRoute must be a string')
  if (typeof rawIndex.copilotContext !== 'string')
    throw new TutorialProjectLoadError('index.json copilotContext must be a string')
  return {
    project: { type: 'spx', root: project.root },
    inEditorRoute: rawIndex.inEditorRoute,
    copilotContext: rawIndex.copilotContext
  }
}

function requireFile(files: Files, path: string) {
  const file = files[path]
  if (file == null) throw new TutorialProjectLoadError(`missing required file: ${path}`)
  return file
}

async function parseConfig(file: File, path: string) {
  try {
    return asRecord(await toConfig(file), path)
  } catch (error) {
    throw new TutorialProjectLoadError(
      `invalid JSON in ${path}: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

function asRecord(value: unknown, name: string): Record<string, unknown> {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TutorialProjectLoadError(`${name} must be a JSON object`)
  }
  return value as Record<string, unknown>
}

function isRelativeDirectory(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.split('/').every((segment) => segment !== '' && segment !== '.' && segment !== '..')
  )
}

function extractDirectory(files: Files, directory: string) {
  const prefix = `${directory}/`
  const extracted: Files = {}
  for (const [path, file] of Object.entries(files)) {
    if (path.startsWith(prefix)) extracted[path.slice(prefix.length)] = file
  }
  return extracted
}

function prefixFiles(files: Files, directory: string) {
  const prefixed: Files = {}
  for (const [path, file] of Object.entries(files)) {
    prefixed[`${directory}/${path}`] = file
  }
  return prefixed
}

async function cloneFiles(files: Files) {
  const cloned: Files = {}
  for (const [path, file] of Object.entries(files)) {
    if (file == null) continue
    cloned[path] = new File(file.name, (signal) => file.arrayBuffer(signal), {
      type: file.type,
      lastModified: file.lastModified,
      meta: { ...file.meta }
    })
  }
  return cloned
}
