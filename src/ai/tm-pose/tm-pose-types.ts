import type * as tfModule from '@tensorflow/tfjs'
import type * as tmPoseModule from '@teachablemachine/pose'
import type { CustomPoseNet } from '@teachablemachine/pose'

import type { TmPoseLabel } from '@/types/study'

export type TmPoseRuntimeStrategy = 'NPM_ESM' | 'LOCAL_UMD'

export type TmPoseEngineStatus =
  | 'IDLE'
  | 'LOADING_RUNTIME'
  | 'LOADING_METADATA'
  | 'LOADING_MODEL'
  | 'VALIDATING_MODEL'
  | 'READY'
  | 'RUNNING'
  | 'PAUSED'
  | 'ERROR'
  | 'DISPOSING'
  | 'DISPOSED'

export type TmPoseErrorCode =
  | 'RUNTIME_LOAD_FAILED'
  | 'METADATA_NOT_FOUND'
  | 'METADATA_INVALID'
  | 'MODEL_NOT_FOUND'
  | 'MODEL_LOAD_FAILED'
  | 'WEIGHTS_LOAD_FAILED'
  | 'LABEL_COUNT_MISMATCH'
  | 'LABEL_NAME_MISMATCH'
  | 'MODEL_OUTPUT_MISMATCH'
  | 'INPUT_NOT_READY'
  | 'POSE_ESTIMATION_FAILED'
  | 'PREDICTION_FAILED'
  | 'RUNTIME_DISPOSED'
  | 'UNKNOWN'

export interface TmPoseMetadata {
  tfjsVersion?: string
  tmVersion?: string
  packageVersion?: string
  packageName?: string
  modelName?: string
  timeStamp?: string
  labels: string[]
  modelSettings?: {
    posenet?: {
      architecture?: string
      outputStride?: number
      inputResolution?: number
      multiplier?: number
    }
  }
}

export interface TmPoseRuntime {
  backend: string
  loadModel: (modelUrl: string, metadata: TmPoseMetadata) => Promise<CustomPoseNet>
  strategy: TmPoseRuntimeStrategy
  tf: typeof tfModule
  tfjsVersion: string
  tmPose: typeof tmPoseModule
  tmPoseVersion: string
}

export interface TmPoseModelInfo {
  inputResolution: number
  isFinalModel: true
  labels: TmPoseLabel[]
  modelName: string | null
  modelVersion: string
  runtimeStrategy: TmPoseRuntimeStrategy
  tfjsVersion: string
  tmPoseVersion: string
  trainedAt: string | null
}

export interface TmPoseClassProbability {
  label: TmPoseLabel
  probability: number
}

export interface TmPosePredictionResult {
  available: boolean
  confidence: number
  inferenceMs: number
  modelVersion: string
  poseScore: number | null
  probabilities: Record<TmPoseLabel, number>
  runtimeStrategy: TmPoseRuntimeStrategy
  sortedProbabilities: TmPoseClassProbability[]
  timestampMs: number
  topLabel: TmPoseLabel | null
}

export interface TmPoseRuntimeSnapshot {
  averageInferenceMs: number
  currentIntervalMs: number
  enabled: boolean
  error: import('@/ai/tm-pose/tm-pose-errors').TmPoseError | null
  estimatedHz: number
  modelInfo: TmPoseModelInfo | null
  prediction: TmPosePredictionResult | null
  status: TmPoseEngineStatus
}

export interface TmPoseInputOptions {
  cropMode: 'CENTER_SQUARE'
  inputSize: number
  mirror: boolean
}
