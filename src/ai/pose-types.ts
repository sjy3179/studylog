import type { CameraErrorInfo, CameraStatus } from '@/camera/camera-types'

export type PoseEngineStatus =
  | 'IDLE'
  | 'LOADING_ASSETS'
  | 'INITIALIZING'
  | 'READY'
  | 'RUNNING'
  | 'PAUSED'
  | 'ERROR'
  | 'DISPOSED'

export type PosePresenceStatus =
  | 'UNKNOWN'
  | 'DETECTED'
  | 'TEMPORARILY_MISSING'
  | 'MISSING'

export interface NormalizedPoseLandmark {
  x: number
  y: number
  z: number
  visibility: number | null
  presence: number | null
}

export type WorldPoseLandmark = NormalizedPoseLandmark

export interface PoseFrameResult {
  timestampMs: number
  detected: boolean
  landmarks: NormalizedPoseLandmark[]
  worldLandmarks: WorldPoseLandmark[] | null
  inferenceMs: number
  sourceWidth: number
  sourceHeight: number
  validLandmarkCount: number
}

export interface PostureFeatures {
  shoulderWidth: number
  noseToShoulderVerticalRatio: number
  shoulderTiltRatio: number
  headHorizontalOffsetRatio: number
  faceScaleRatio: number | null
  leftWristToFaceRatio: number | null
  rightWristToFaceRatio: number | null
}

export type CalibrationStatus =
  | 'NOT_CALIBRATED'
  | 'READY_TO_START'
  | 'COUNTDOWN'
  | 'COLLECTING'
  | 'PROCESSING'
  | 'CALIBRATED'
  | 'FAILED'
  | 'CANCELLED'

export interface CalibrationQuality {
  validSampleRatio: number
  movementScore: number
  acceptable: boolean
  warnings: string[]
}

export interface CalibrationProfile {
  id: string
  version: 1
  createdAt: string
  cameraDeviceId: string | null
  sampleCount: number
  baseline: {
    noseToShoulderVerticalRatio: number
    shoulderTiltRatio: number
    headHorizontalOffsetRatio: number
    faceScaleRatio: number | null
  }
  quality: {
    validSampleRatio: number
    movementScore: number
  }
}

export interface CalibrationContext {
  cameraDeviceId: string | null
  createdAt?: string
}

export type DeviationReason =
  | 'FACE_MOVED_CLOSER'
  | 'HEAD_DROPPED'
  | 'SHOULDER_TILTED'
  | 'BODY_SHIFTED'

export interface PostureDeviation {
  score: number
  level: 'LOW' | 'MEDIUM' | 'HIGH'
  reasons: DeviationReason[]
  metrics: {
    faceScaleDelta: number | null
    headDropDelta: number
    shoulderTiltDelta: number
    horizontalOffsetDelta: number
  }
}

export interface PoseEngineErrorInfo {
  code: 'WASM_ASSET_ERROR' | 'MODEL_ASSET_ERROR' | 'INITIALIZATION_ERROR' | 'INFERENCE_ERROR'
  message: string
}

export interface PoseRuntimeSnapshot {
  cameraStatus: CameraStatus
  engineStatus: PoseEngineStatus
  presenceStatus: PosePresenceStatus
  latestFrame: PoseFrameResult | null
  features: PostureFeatures | null
  calibration: CalibrationProfile | null
  calibrationStatus: CalibrationStatus
  deviation: PostureDeviation | null
  inferenceHz: number
  averageInferenceMs: number
  error: CameraErrorInfo | null
  engineError: PoseEngineErrorInfo | null
}
