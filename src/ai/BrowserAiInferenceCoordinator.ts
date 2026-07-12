export type BrowserAiEngine = 'MEDIAPIPE' | 'TM_POSE'

export class BrowserAiInferenceCoordinator {
  private owner: BrowserAiEngine | null = null

  tryAcquire(engine: BrowserAiEngine): boolean {
    if (this.owner !== null) return false
    this.owner = engine
    return true
  }

  release(engine: BrowserAiEngine): void {
    if (this.owner === engine) this.owner = null
  }
}

export const browserAiInferenceCoordinator = new BrowserAiInferenceCoordinator()
