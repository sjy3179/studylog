import type { StablePostureState } from "@/types/study";

export type PostureClassifierInput = HTMLVideoElement | HTMLCanvasElement;

/**
 * Replaceable posture source used by the app. The Phase 1 mock ignores the
 * optional image input; a later camera-backed implementation can use it.
 */
export interface PostureClassifier {
  initialize(): Promise<void>;
  predict(input?: PostureClassifierInput): Promise<StablePostureState>;
  getState(): StablePostureState;
  dispose(): void;
}
