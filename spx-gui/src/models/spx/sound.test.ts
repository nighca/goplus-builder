import { describe, expect, it } from 'vitest'
import { fromText, toConfig } from '../common/file'
import { SpxProject } from './project'
import { Sprite } from './sprite'
import { Costume } from './costume'
import { Sound } from './sound'
import { Animation } from './animation'

function mockFile(name = 'mocked') {
  return fromText(name, Math.random() + '')
}

function makeProject() {
  const project = new SpxProject()
  const sprite = new Sprite('MySprite')
  const costume = new Costume('default', mockFile())
  sprite.addCostume(costume)
  const animationCostumes = Array.from({ length: 3 }, (_, i) => new Costume(`a${i}`, mockFile()))
  const animation = Animation.create('default', animationCostumes)
  sprite.addAnimation(animation)
  const sound = new Sound('sound', mockFile())
  project.addSprite(sprite)
  project.addSound(sound)
  animation.setSound(sound.id)
  return project
}

describe('Sound', () => {
  it('should clone correctly', () => {
    const project = makeProject()
    const sound = project.sounds[0]

    const clone = sound.clone()
    expect(clone.id).not.toEqual(sound.id)
    expect(clone.name).toEqual(sound.name)
    expect(clone.rate).toEqual(sound.rate)
    expect(clone.file).toEqual(sound.file)
    expect(clone.sampleCount).toEqual(sound.sampleCount)
    expect(clone.assetMetadata).toEqual(sound.assetMetadata)
    expect(clone.extraConfig).toEqual(sound.extraConfig)

    project.addSound(clone)
    expect(clone._project).toEqual(project)

    const sprite = project.sprites[0]
    const animation = sprite.animations[0]
    expect(animation.sound).not.toBe(clone.id)
  })

  it('uses the logical name as the resource directory and a safe filename', async () => {
    const sound = new Sound('sound', fromText('sound.mp3', 'sound'))
    const files = sound.export()

    expect(Object.keys(files).sort()).toEqual(['assets/sounds/sound/index.json', 'assets/sounds/sound/sound-sound.mp3'])
    expect(await toConfig(files['assets/sounds/sound/index.json']!)).toMatchObject({
      path: 'sound-sound.mp3'
    })
    await expect(Sound.loadAll(files)).resolves.toMatchObject([{ name: 'sound' }])
  })
})
