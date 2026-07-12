import type { NormalizedPoseLandmark, PoseFrameResult, PostureFeatures } from '@/ai/pose-types'

export function createLandmarks(): NormalizedPoseLandmark[] {
  const landmarks = Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 1,
    presence: 1,
  }))
  landmarks[0] = { ...landmarks[0], x: 0.5, y: 0.3 }
  landmarks[3] = { ...landmarks[3], x: 0.46, y: 0.32 }
  landmarks[6] = { ...landmarks[6], x: 0.54, y: 0.32 }
  landmarks[7] = { ...landmarks[7], x: 0.44, y: 0.35 }
  landmarks[8] = { ...landmarks[8], x: 0.56, y: 0.35 }
  landmarks[11] = { ...landmarks[11], x: 0.4, y: 0.6 }
  landmarks[12] = { ...landmarks[12], x: 0.6, y: 0.6 }
  landmarks[15] = { ...landmarks[15], x: 0.35, y: 0.45 }
  landmarks[16] = { ...landmarks[16], x: 0.65, y: 0.45 }
  return landmarks
}

export function createPoseFrame(landmarks = createLandmarks()): PoseFrameResult {
  return {
    timestampMs: 1,
    detected: true,
    landmarks,
    worldLandmarks: null,
    inferenceMs: 4,
    sourceWidth: 1280,
    sourceHeight: 720,
    validLandmarkCount: 33,
  }
}

export function createFeatures(overrides: Partial<PostureFeatures> = {}): PostureFeatures {
  return {
    shoulderWidth: 0.2,
    noseToShoulderVerticalRatio: 1.5,
    shoulderTiltRatio: 0.05,
    headHorizontalOffsetRatio: 0.05,
    faceScaleRatio: 0.6,
    leftWristToFaceRatio: 1,
    rightWristToFaceRatio: 1,
    ...overrides,
  }
}
