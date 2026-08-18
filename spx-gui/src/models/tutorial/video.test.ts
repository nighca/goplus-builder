import { describe, expect, it } from 'vitest'

import { fromConfig, fromText, toConfig, toText, type Files } from '@/models/common/file'
import { TutorialProjectLoadError } from './common'
import { TutorialVideo } from './video'

function makeFiles(): Files {
  return {
    'assets/videos/step-to/index.json': fromConfig('index.json', { path: 'media/step-to.mp4' }),
    'assets/videos/step-to/media/step-to.mp4': fromText('step-to.mp4', 'video')
  }
}

describe('TutorialVideo', () => {
  it('loads and exports a named video resource', async () => {
    const video = await TutorialVideo.load('step-to', makeFiles())

    expect(video.path).toBe('media/step-to.mp4')
    expect(await toText(video.file)).toBe('video')

    const exported = video.export()
    expect(await toConfig(exported['assets/videos/step-to/index.json']!)).toEqual({
      path: 'media/step-to.mp4',
      builder_id: video.id
    })
    expect(await toText(exported['assets/videos/step-to/media/step-to.mp4']!)).toBe('video')
  })

  it('loads every declared video and rejects incomplete resources', async () => {
    const files = makeFiles()
    files['assets/videos/another/index.json'] = fromConfig('index.json', { path: 'another.mp4' })
    files['assets/videos/another/another.mp4'] = fromText('another.mp4', 'another video')

    expect((await TutorialVideo.loadAll(files)).map((video) => video.name)).toEqual(['step-to', 'another'])

    const incomplete = makeFiles()
    incomplete['assets/videos/step-to/index.json'] = fromConfig('index.json', { path: '../step-to.mp4' })
    await expect(TutorialVideo.load('step-to', incomplete)).rejects.toThrow(TutorialProjectLoadError)
  })

  it('clones resource state without changing its serialized contract', async () => {
    const video = await TutorialVideo.load('step-to', makeFiles())
    const clone = video.clone()

    expect(clone).not.toBe(video)
    expect(clone.file).not.toBe(video.file)
    expect(clone.id).not.toBe(video.id)
    expect(await toConfig(clone.export()['assets/videos/step-to/index.json']!)).toEqual({
      path: 'media/step-to.mp4',
      builder_id: clone.id
    })
    expect(await toText(clone.export()['assets/videos/step-to/media/step-to.mp4']!)).toBe('video')
  })
})
