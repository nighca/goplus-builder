import { nanoid } from 'nanoid'
import { reactive } from 'vue'

import { join } from '@/utils/path'
import { File, fromConfig, listDirs, toConfig, type Files } from '@/models/common/file'

import { TutorialProjectLoadError } from './common'
import type { TutorialProject } from './project'

export type RawTutorialVideoConfig = {
  path: string
  builder_id?: string
}

export const tutorialVideoAssetPath = 'assets/videos'
const videoConfigFileName = 'index.json'

export class TutorialVideo {
  id: string
  project: TutorialProject | null = null
  name: string
  path: string
  file: File

  constructor(name: string, path: string, file: File, id?: string) {
    this.id = id ?? nanoid()
    this.name = name
    this.path = path
    this.file = file
    return reactive(this) as this
  }

  setProject(project: TutorialProject | null) {
    this.project = project
  }

  setName(name: string) {
    if (!isPathSegment(name)) throw new Error(`invalid video name: ${name}`)
    if (this.project?.videos.some((video) => video !== this && video.name === name)) {
      throw new Error(`video ${name} already exists`)
    }
    this.name = name
  }

  setFile(file: File) {
    this.file = file
  }

  static async load(name: string, files: Files) {
    if (!isPathSegment(name)) throw new TutorialProjectLoadError(`invalid video name: ${name}`)
    const directory = join(tutorialVideoAssetPath, name)
    const configFile = files[join(directory, videoConfigFileName)]
    if (configFile == null) throw new TutorialProjectLoadError(`missing video configuration: ${name}`)

    const config = await loadConfig(configFile, name)
    if (!isRelativePath(config.path)) {
      throw new TutorialProjectLoadError(`video ${name} path must be a relative file path`)
    }
    const file = files[join(directory, config.path)]
    if (file == null) throw new TutorialProjectLoadError(`missing video file: ${name}/${config.path}`)
    return new TutorialVideo(name, config.path, file, config.builder_id)
  }

  static async loadAll(files: Files) {
    return Promise.all(listDirs(files, tutorialVideoAssetPath).map((name) => TutorialVideo.load(name, files)))
  }

  clone(preserveId = false) {
    const file = this.file
    return new TutorialVideo(
      this.name,
      this.path,
      new File(file.name, (signal) => file.arrayBuffer(signal), {
        type: file.type,
        lastModified: file.lastModified,
        meta: { ...file.meta }
      }),
      preserveId ? this.id : undefined
    )
  }

  export(): Files {
    const directory = join(tutorialVideoAssetPath, this.name)
    return {
      [join(directory, videoConfigFileName)]: fromConfig(videoConfigFileName, {
        path: this.path,
        builder_id: this.id
      }),
      [join(directory, this.path)]: this.file
    }
  }
}

async function loadConfig(file: File, name: string): Promise<RawTutorialVideoConfig> {
  let config: unknown
  try {
    config = await toConfig(file)
  } catch (error) {
    throw new TutorialProjectLoadError(
      `invalid video configuration for ${name}: ${error instanceof Error ? error.message : String(error)}`
    )
  }
  if (config == null || typeof config !== 'object' || Array.isArray(config)) {
    throw new TutorialProjectLoadError(`invalid video configuration for ${name}`)
  }
  if (!('path' in config) || !isRelativePath(config.path)) {
    throw new TutorialProjectLoadError(`invalid video configuration for ${name}`)
  }
  const id = 'builder_id' in config ? config.builder_id : undefined
  if (id != null && typeof id !== 'string') {
    throw new TutorialProjectLoadError(`invalid video configuration for ${name}`)
  }
  return { path: config.path, builder_id: typeof id === 'string' ? id : undefined }
}

function isPathSegment(value: string) {
  return value !== '' && value !== '.' && value !== '..' && !value.includes('/')
}

function isRelativePath(value: unknown): value is string {
  return typeof value === 'string' && value.split('/').every(isPathSegment)
}
