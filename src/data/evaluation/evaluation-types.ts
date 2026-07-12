import type { TmPoseLabel } from '@/types/study'

export type EvaluationLightingCondition = 'BRIGHT' | 'NORMAL' | 'DIM'
export type EvaluationCameraDistance = 'NEAR' | 'NORMAL' | 'FAR'

export interface EvaluationRecord {
  schemaVersion: 1
  id: string
  createdAtIso: string
  participantCode: string
  actualLabel: TmPoseLabel
  predictedLabel: TmPoseLabel
  correct: boolean
  averageConfidence: number
  averageGoodProbability: number
  averageForwardProbability: number
  averageSideProbability: number
  averageRestingProbability: number
  validSampleCount: number
  rejectedSampleCount: number
  collectionDurationMs: number
  modelVersion: string
  mirrorCamera: boolean
  lightingCondition: EvaluationLightingCondition
  cameraDistance: EvaluationCameraDistance
  environmentNote: string
}
