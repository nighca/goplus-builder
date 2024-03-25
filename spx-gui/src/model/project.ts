/**
 * @file class Project
 * @desc Object-model definition for Project
 */

import { reactive, watch } from 'vue'

import { join } from '@/util/path'
import { IsPublic } from '../api/project'
import { Disposble } from './common/disposable'
import { toConfig, type Files, fromConfig } from './common/file'
import { Stage, type RawStageConfig } from './stage'
import { Sprite } from './sprite'
import { Sound } from './sound'
import * as cloudHelper from './common/cloud'
import * as localHelper from './common/local'
import * as zipHelper from './common/zip'
import { assign } from './common'

export type Metadata = {
  id?: string
  owner?: string
  name?: string
  isPublic?: IsPublic
  version?: number
  cTime?: string
  uTime?: string
}

const projectConfigFileName = 'index.json'
const projectConfigFilePath = join('assets', projectConfigFileName)

type ProjectConfig = {
  // TODO: support other types in zorder
  zorder: string[]
  // TODO: camera
}

type RawProjectConfig = RawStageConfig & Partial<ProjectConfig>

export class Project extends Disposble {

  id?: string
  owner?: string
  name?: string
  isPublic?: IsPublic
  version?: number
  cTime?: string
  uTime?: string

  stage!: Stage
  sprites!: Sprite[]
  sounds!: Sound[]
  config!: ProjectConfig

  removeSprite(name: string) {
    const idx = this.sprites.findIndex(s => s.name === name)
    const [sprite] = this.sprites.splice(idx, 1)
    sprite.dispose()
  }
  addSprite(sprite: Sprite) {
    this.sprites.push(sprite)
    // add to zorder
    if (!this.config.zorder.includes(sprite.name)) {
      this.config.zorder = [...this.config.zorder, sprite.name]
    }
    // update zorder when sprite renaming
    sprite.addDisposer(watch(() => sprite.name, (newName, originalName) => {
      this.config.zorder = this.config.zorder.map(v => v === originalName ? newName : v)
    }))
    // update zorder when sprite deleted
    sprite.addDisposer(() => {
      this.config.zorder = this.config.zorder.filter(v => v !== sprite.name)
    })
  }
  setSpriteZorderIdx(name: string, newIdx: number | ((idx: number, length: number) => number)) {
    const idx = this.config.zorder.findIndex(v => v === name)
    if (idx < 0) throw new Error(`sprite ${name} not found in zorder`)
    const newIdxVal = typeof newIdx === 'function' ? newIdx(idx, this.config.zorder.length) : newIdx
    const newZorder = this.config.zorder.filter(v => v !== name)
    newZorder.splice(newIdxVal, 0, name)
    this.config.zorder = newZorder
  }
  upSpriteZorder(name: string) {
    this.setSpriteZorderIdx(name, i => i+1)
  }
  downSpriteZorder(name: string) {
    this.setSpriteZorderIdx(name, i => i-1)
  }
  topSpriteZorder(name: string) {
    this.setSpriteZorderIdx(name, (_, len) => len - 1)
  }
  bottomSpriteZorder(name: string) {
    this.setSpriteZorderIdx(name, 0)
  }

  removeSound(name: string) {
    const idx = this.sounds.findIndex(s => s.name === name)
    this.sounds.splice(idx, 1)
  }
  addSound(sound: Sound) {
    this.sounds.push(sound)
  }

  constructor() {
    super()
    this.load({}, {}) // ensure stage, sprites, sounds, zorder etc.
    this.addDisposer(() => {
      for (const sprite of this.sprites) {
        sprite.dispose()
      }
    })
    return reactive(this) as Project
  }

  /** Load with metadata & files */
  async load(metadata: Metadata, files: Files) {
    const configFile = files[projectConfigFilePath]
    const config: RawProjectConfig = {}
    if (configFile != null) {
      Object.assign(config, await toConfig(configFile))
    }
    const { zorder, ...stageConfig } = config
    const [stage, sounds, sprites] = await Promise.all([
      Stage.load(stageConfig, files),
      Sound.loadAll(files),
      Sprite.loadAll(files)
    ])
    assign<Project>(this, metadata)
    this.config = {
      zorder: zorder ?? []
    }
    this.stage = stage
    this.sprites = []
    sprites.forEach(s => this.addSprite(s))
    this.sounds = []
    sounds.forEach(s => this.addSound(s))
  }

  /** Export metadata & files */
  export(): [Metadata, Files] {
    const metadata: Metadata = {
      id: this.id,
      owner: this.owner,
      name: this.name,
      isPublic: this.isPublic,
      version: this.version,
      cTime: this.cTime,
      uTime: this.uTime
    }
    const files: Files = {}
    const [stageConfig, stageFiles] = this.stage.export()
    const config: RawProjectConfig = { ...stageConfig, ...this.config }
    files[projectConfigFilePath] = fromConfig(projectConfigFileName, config)
    Object.assign(files, stageFiles)
    Object.assign(files, ...this.sprites.map(s => s.export()))
    Object.assign(files, ...this.sounds.map(s => s.export()))
    return [metadata, files]
  }

  /** Load from a zip file */
  async loadZipFile(zipFile: globalThis.File) {
    const { metadata, files } = await zipHelper.load(zipFile)
    this.load({
      // name is the only metadata we need when load from file
      name: this.name ?? metadata.name
    }, files)
  }

  /** Export to a zip file */
  async exportZipFile() {
    const [metadata, files] = this.export()
    return await zipHelper.save(metadata, files)
  }

  // TODO: Some go+-builder-specific file format (instead of zip) support?

  /** Load from cloud */
  async loadFromCloud(owner: string, name: string) {
    const { metadata, files } = await cloudHelper.load(owner, name)
    await this.load(metadata, files)
  }

  /** Save to cloud */
  async saveToCloud() {
    const [metadata, files] = this.export()
    await cloudHelper.save(metadata, files)
  }

  /** Load from local cache */
  async loadFromLocalCache(cacheKey: string) {
    const cached = await localHelper.load(cacheKey)
    if (cached == null) throw new Error('no project in local cache')
    const { metadata, files } = cached
    await this.load(metadata, files)
  }

  /** Sync to local cache */
  syncToLocalCache(cacheKey: string) {
    this.addDisposer(watch(
      () => this.export(),
      ([metadata, files]) => {
        localHelper.save(cacheKey, metadata, files)
      },
      { immediate: true }
    ))
  }

}

/** Get full name for project, which stands for a globally unique identifier for the project */
export function fullName(owner: string, name: string) {
  return `${owner}/${name}`
}
