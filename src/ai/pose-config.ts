export const MEDIAPIPE_WASM_PATH = '/mediapipe/wasm'
export const POSE_LANDMARKER_MODEL_PATH = '/models/mediapipe/pose_landmarker_lite.task'

export const POSE_ENGINE_OPTIONS = {
  numPoses: 1,
  minPoseDetectionConfidence: 0.5,
  minPosePresenceConfidence: 0.5,
  minTrackingConfidence: 0.5,
  outputSegmentationMasks: false,
} as const

export const POSE_INFERENCE_INTERVAL_MS = 140

export const POSE_VALIDATION_CONFIG = {
  minVisibility: 0.5,
  minPresence: 0.5,
  minShoulderWidth: 0.05,
  temporarilyMissingMs: 800,
} as const

export const CALIBRATION_CONFIG = {
  countdownMs: 3_000,
  collectionMs: 2_500,
  minimumSamples: 12,
  recommendedSamples: 15,
  minimumValidSampleRatio: 0.6,
  maximumMovementScore: 0.45,
} as const

export const DEVIATION_THRESHOLDS = {
  faceScaleDelta: 0.2,
  headDropDelta: 0.15,
  shoulderTiltDelta: 0.12,
  horizontalOffsetDelta: 0.2,
} as const

export const DEVIATION_WEIGHTS = {
  faceScale: 0.25,
  headDrop: 0.35,
  shoulderTilt: 0.2,
  horizontalOffset: 0.2,
} as const
