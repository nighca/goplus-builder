import { describe, expect, it } from 'vitest'

import { fromConfig, fromText, toText, type Files } from '@/models/common/file'
import { Sprite } from '@/models/spx/sprite'
import { TutorialProjectLoadError } from './common'
import { TutorialProject } from './project'
import { TutorialVideo } from './video'

function makeFiles(): Files {
  return {
    'index.json': fromConfig('index.json', {
      project: { type: 'spx', root: 'project' },
      inEditorRoute: '/simple/sprites/Lita',
      copilotContext: 'Help the learner.'
    }),
    'main.gox': fromText('main.gox', 'onStart => {}'),
    'project/assets/index.json': fromConfig('index.json', {}),
    'assets/videos/step-to/index.json': fromConfig('index.json', { path: 'step-to.mp4' }),
    'assets/videos/step-to/step-to.mp4': fromText('step-to.mp4', 'video')
  }
}

describe('TutorialProject', () => {
  it('loads its program, embedded SPX project and named videos', async () => {
    const tutorial = await TutorialProject.fromFiles(makeFiles())

    expect(await toText(tutorial.program)).toBe('onStart => {}')
    expect(await toText(tutorial.getVideo('step-to')!.file)).toBe('video')
    expect(tutorial.videos.map((video) => video.name)).toEqual(['step-to'])
    expect(tutorial.getVideo('missing')).toBeNull()
    expect((await tutorial.createSpxProject()).owner).toBeUndefined()
  })

  it('reports incomplete or malformed Tutorial projects at load time', async () => {
    const files = makeFiles()
    delete files['main.gox']
    await expect(TutorialProject.fromFiles(files)).rejects.toThrow(TutorialProjectLoadError)

    const invalidVideoFiles = makeFiles()
    invalidVideoFiles['assets/videos/step-to/index.json'] = fromConfig('index.json', { path: '../step-to.mp4' })
    await expect(TutorialProject.fromFiles(invalidVideoFiles)).rejects.toThrow(TutorialProjectLoadError)
  })

  it('creates isolated projects and serializes edited project state', async () => {
    const tutorial = await TutorialProject.fromFiles(makeFiles())
    const authorProject = await tutorial.createSpxProject()
    authorProject.addSprite(new Sprite('Lita'))

    const previewProject = await tutorial.createSpxProject()
    expect(previewProject.sprites).toHaveLength(0)

    const serialized = await tutorial.exportFiles(authorProject)
    const roundTripped = await TutorialProject.fromFiles(serialized)
    expect((await roundTripped.createSpxProject()).sprites.map((sprite) => sprite.name)).toEqual(['Lita'])

    const clone = await tutorial.clone()
    expect(await toText(clone.program)).toBe('onStart => {}')
  })

  it('owns videos for editor operations and preserves their IDs when serializing', async () => {
    const tutorial = await TutorialProject.fromFiles(makeFiles())
    const video = tutorial.getVideo('step-to')!
    expect(video.project).toBe(tutorial)

    video.setName('step-to-2')
    expect(tutorial.getVideo('step-to')).toBeNull()
    expect(tutorial.getVideo('step-to-2')).toBe(video)

    const added = new TutorialVideo('another', 'another.mp4', fromText('another.mp4', 'another'))
    tutorial.addVideo(added)
    expect(added.project).toBe(tutorial)
    tutorial.removeVideo(added.id)
    expect(added.project).toBeNull()

    const serialized = await tutorial.exportFiles()
    const reloaded = await TutorialProject.fromFiles(serialized)
    expect(reloaded.getVideo('step-to-2')!.id).toBe(video.id)
  })
})
