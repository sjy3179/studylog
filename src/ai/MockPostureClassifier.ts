import type { PostureClassifier } from "@/ai/PostureClassifier";
import type { MockPostureState } from "@/types/study";

/** A deterministic posture source for the camera-free Phase 1 demo. */
export class MockPostureClassifier implements PostureClassifier {
  private state: MockPostureState;

  constructor(initialState: MockPostureState = "GOOD") {
    this.state = initialState;
  }

  async initialize(): Promise<void> {
    // The mock owns no asynchronous resources.
  }

  async predict(): Promise<MockPostureState> {
    return this.state;
  }

  getState(): MockPostureState {
    return this.state;
  }

  setState(state: MockPostureState): void {
    this.state = state;
  }

  dispose(): void {
    // The mock owns no disposable resources.
  }
}
