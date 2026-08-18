import { reactive } from 'vue'

import type { PlaygroundCourseData } from '@/apis/course'
import { getFiles } from '@/models/common/cloud'
import {
  extractFiles,
  fromConfig,
  fromText,
  prefixFiles,
  removeFiles,
  toConfig,
  toText,
  type Files
} from '@/models/common/file'
import { SpxProject } from '@/models/spx/project'

import { Video, videoAssetPath } from './video'

const indexFilePath = 'index.json'
const courseCodeFilePath = 'main.gox'

export type TutorialProjectIndex = {
  project: {
    type: 'spx'
    root: string
  }
  inEditorRoute: string
  copilotContext: string
}

export type TutorialProjectMetadata = Omit<PlaygroundCourseData, 'content'>

export type TutorialProjectSerialized = {
  metadata: TutorialProjectMetadata
  files: Files
}

export { Video } from './video'

export class TutorialProject {
  id: string
  owner: string
  kind = 'playground' as const
  title: string
  thumbnail: string

  index: TutorialProjectIndex | null = null
  project: SpxProject
  courseCode = ''
  videos: Video[] = []
  private files: Files = {}

  constructor(metadata: TutorialProjectMetadata) {
    this.id = metadata.id
    this.owner = metadata.owner
    this.title = metadata.title
    this.thumbnail = metadata.thumbnail
    this.project = new SpxProject()
    return reactive(this) as this
  }

  static async load(course: PlaygroundCourseData) {
    const project = new TutorialProject(course)
    await project.load({ metadata: course, files: getFiles(course.content) })
    return project
  }

  setMetadata(metadata: Partial<TutorialProjectMetadata>) {
    Object.assign(this, metadata)
  }

  async load({ metadata, files }: TutorialProjectSerialized) {
    this.setMetadata(metadata)
    await this.loadFiles(files)
  }

  async loadFiles(files: Files) {
    const indexFile = files[indexFilePath]
    if (indexFile == null) throw new Error(`file ${indexFilePath} not found`)
    const index = (await toConfig(indexFile)) as TutorialProjectIndex
    const courseCodeFile = files[courseCodeFilePath]
    if (courseCodeFile == null) throw new Error(`file ${courseCodeFilePath} not found`)

    await this.project.loadFiles(extractFiles(files, index.project.root))
    const videos = await Video.loadAll(files)

    this.index = index
    this.courseCode = await toText(courseCodeFile)
    this.videos.splice(0).forEach((video) => video.setProject(null))
    videos.forEach((video) => this.addVideo(video))
    this.files = files
  }

  setCourseCode(code: string) {
    this.courseCode = code
  }

  addVideo(video: Video) {
    video.setProject(this)
    try {
      video.setName(video.name)
      this.videos.push(video)
    } catch (error) {
      video.setProject(null)
      throw error
    }
  }

  removeVideo(id: string) {
    const index = this.videos.findIndex((video) => video.id === id)
    if (index < 0) throw new Error(`video ${id} not found`)
    const [video] = this.videos.splice(index, 1)
    video.setProject(null)
  }

  exportFiles() {
    if (this.index == null) throw new Error('Tutorial project has not been loaded')
    const files = { ...this.files }
    removeFiles(files, this.index.project.root)
    removeFiles(files, videoAssetPath)
    files[indexFilePath] = fromConfig(indexFilePath, this.index)
    files[courseCodeFilePath] = fromText(courseCodeFilePath, this.courseCode)
    Object.assign(
      files,
      prefixFiles(this.project.exportFiles(), this.index.project.root),
      ...this.videos.map((video) => video.export())
    )
    return files
  }

  export(): TutorialProjectSerialized {
    return {
      metadata: {
        id: this.id,
        owner: this.owner,
        kind: this.kind,
        title: this.title,
        thumbnail: this.thumbnail
      },
      files: this.exportFiles()
    }
  }
}
