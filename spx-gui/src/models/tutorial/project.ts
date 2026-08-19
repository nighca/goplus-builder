import { reactive } from 'vue'

import type { PlaygroundCourseData } from '@/apis/course'
import { getFiles } from '@/models/common/cloud'
import { assign } from '@/models/common'
import { fromConfig, prefixFiles, toConfig, unprefixFiles, type Files } from '@/models/common/file'
import { SpxProject } from '@/models/spx/project'

import { Course } from './course'
import { ensureValidVideoName, Video } from './video'

const indexFilePath = 'index.json'

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
export { Course } from './course'

export class TutorialProject {
  id = ''
  owner = ''
  kind = 'playground' as const
  title = ''
  thumbnail = ''

  index: TutorialProjectIndex | null = null
  project: SpxProject
  mainCourse: Course
  videos: Video[] = []

  constructor() {
    this.project = new SpxProject()
    this.mainCourse = new Course()
    return reactive(this) as this
  }

  static async load(course: PlaygroundCourseData) {
    const project = new TutorialProject()
    await project.load({ metadata: course, files: getFiles(course.content) })
    return project
  }

  setMetadata(metadata: Partial<TutorialProjectMetadata>) {
    assign<TutorialProject>(this, metadata)
  }

  async load({ metadata, files }: TutorialProjectSerialized) {
    this.setMetadata(metadata)
    await this.loadFiles(files)
  }

  async loadFiles(files: Files) {
    const indexFile = files[indexFilePath]
    if (indexFile == null) throw new Error(`file ${indexFilePath} not found`)
    const index = (await toConfig(indexFile)) as TutorialProjectIndex
    await this.project.loadFiles(unprefixFiles(files, index.project.root))
    await this.mainCourse.loadFiles(files)
    const videos = await Video.loadAll(files)

    this.index = index
    this.videos.splice(0).forEach((video) => video.setProject(null))
    videos.forEach((video) => this.addVideo(video))
  }

  private prepareAddVideo(video: Video) {
    const name = ensureValidVideoName(video.name, this)
    video.setName(name)
    video.setProject(this)
  }

  addVideo(video: Video) {
    this.prepareAddVideo(video)
    this.videos.push(video)
  }

  removeVideo(id: string) {
    const index = this.videos.findIndex((video) => video.id === id)
    if (index < 0) throw new Error(`video ${id} not found`)
    const [video] = this.videos.splice(index, 1)
    video.setProject(null)
  }

  exportFiles() {
    if (this.index == null) throw new Error('Tutorial project has not been loaded')
    const files: Files = {}
    files[indexFilePath] = fromConfig(indexFilePath, this.index)
    Object.assign(
      files,
      prefixFiles(this.project.exportFiles(), this.index.project.root),
      this.mainCourse.export(),
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
