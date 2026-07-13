import { TM_POSE_LABELS } from '@/types/study'
import type { TmPoseLabel } from '@/types/study'

export const TM_POSE_LABEL_TEXT: Record<TmPoseLabel, string> = {
  GOOD_POSTURE: '정상 학습 자세',
  FORWARD_LEAN: '앞으로 기울임',
  SIDE_LEAN: '좌우 기울임',
  RESTING: '휴식·엎드림',
}

export const TM_POSE_MODEL_CONFIG = {
  baseUrl: '/models/tm-pose/',
  metadataUrl: '/models/tm-pose/metadata.json',
  modelUrl: '/models/tm-pose/model.json',
  poseNetModelUrl: '/models/tm-pose/posenet/model-stride16.json',
  version: 'final-v1',
  expectedLabels: TM_POSE_LABELS,
} as const

export const TM_POSE_INFERENCE_CONFIG = {
  defaultInputResolution: 257,
  minInputResolution: 129,
  maxInputResolution: 513,
  minPoseScore: 0.2,
  minKeypointScore: 0.35,
  initialIntervalMs: 400,
  mediumIntervalMs: 600,
  slowIntervalMs: 1_000,
  mediumInferenceThresholdMs: 250,
  slowInferenceThresholdMs: 450,
  initialOffsetMs: 70,
} as const

export function withModelVersion(url: string): string {
  return `${url}?v=${encodeURIComponent(TM_POSE_MODEL_CONFIG.version)}`
}
