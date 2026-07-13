import type { PostureClassifier } from '@/ai/PostureClassifier'
import type { MockPostureState } from '@/types/study'

interface MockModelInfo {
  mode: 'MOCK'
}

/** A deterministic posture source for the camera-free Phase 1 demo. */
export class MockPostureClassifier
  implements PostureClassifier<void, MockPostureState, 'READY', MockModelInfo>
{
  private state: MockPostureState

  constructor(initialState: MockPostureState = "GOOD") {
    this.state = initialState
  }

  async initialize(): Promise<void> {
    // The mock owns no asynchronous resources.
  }

  async predict(): Promise<MockPostureState> {
    return this.state
  }

  getStatus(): 'READY' {
    return 'READY'
  }

  getModelInfo(): MockModelInfo {
    return { mode: 'MOCK' }
  }

  getState(): MockPostureState {
    return this.state
  }

  setState(state: MockPostureState): void {
    this.state = state
  }

  dispose(): void {
    // The mock owns no disposable resources.
  }
}
