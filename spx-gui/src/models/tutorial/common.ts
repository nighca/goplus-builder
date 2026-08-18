export class TutorialProjectLoadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TutorialProjectLoadError'
  }
}
