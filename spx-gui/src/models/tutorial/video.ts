import { nanoid } from 'nanoid'
import { reactive } from 'vue'

import { extname, join, resolve } from '@/utils/path'
import { File, fromConfig, listDirs, toConfig, type Files } from '@/models/common/file'

import type { TutorialProject } from './project'

export type VideoInits = {
  id?: string
}

export type RawVideoConfig = Omit<VideoInits, 'id'> & {
  builder_id?: string
  path?: string
}

export const videoAssetPath = 'assets/videos'
const videoConfigFileName = 'index.json'

export type VideoExportLoadOptions = {
  includeId?: boolean
}

export class Video {
  id: string

  _project: TutorialProject | null = null
  setProject(project: TutorialProject | null) {
    this._project = project
  }

  name: string
  setName(name: string) {
    const error = validateVideoName(name, this._project)
    if (error != null) throw new Error(`invalid video name ${name}: ${error}`)
    this.name = name
  }

  file: File
  setFile(file: File) {
    this.file = file
  }

  constructor(name: string, file: File, inits?: VideoInits) {
    this.id = inits?.id ?? nanoid()
    this.name = name
    this.file = file
    return reactive(this) as this
  }

  static async load(name: string, files: Files, { includeId = true }: VideoExportLoadOptions = {}) {
    const pathPrefix = join(videoAssetPath, name)
    const configFile = files[join(pathPrefix, videoConfigFileName)]
    if (configFile == null) return null
    const { builder_id: id, path } = (await toConfig(configFile)) as RawVideoConfig
    if (path == null) throw new Error(`path expected for video ${name}`)
    const file = files[resolve(pathPrefix, path)]
    if (file == null) throw new Error(`file ${path} for video ${name} not found`)
    return new Video(name, file, { id: includeId ? id : undefined })
  }

  static async loadAll(files: Files, options?: VideoExportLoadOptions) {
    const names = listDirs(files, videoAssetPath)
    const videos = (await Promise.all(names.map((name) => Video.load(name, files, options)))).filter(
      (video) => video != null
    )
    return videos as Video[]
  }

  export({ includeId = true }: VideoExportLoadOptions = {}): Files {
    const filename = this.name + extname(this.file.name)
    const config: RawVideoConfig = { path: filename }
    if (includeId) config.builder_id = this.id
    const assetPath = join(videoAssetPath, this.name)
    return {
      [join(assetPath, videoConfigFileName)]: fromConfig(videoConfigFileName, config),
      [join(assetPath, filename)]: this.file
    }
  }
}

export function validateVideoName(name: string, project: TutorialProject | null) {
  if (name === '') return 'must not be blank'
  if (name.includes('/')) return 'must not contain /'
  if (project?.videos.some((video) => video.name === name)) return 'already exists'
}

export function ensureValidVideoName(name: string, project: TutorialProject | null) {
  const error = validateVideoName(name, project)
  if (error == null) return name
  if (error !== 'already exists') throw new Error(`invalid video name ${name}: ${error}`)
  for (let i = 2; ; i++) {
    const candidate = `${name}${i}`
    if (validateVideoName(candidate, project) == null) return candidate
  }
}
