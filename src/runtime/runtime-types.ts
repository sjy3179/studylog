import type { DeviationReason } from '@/ai/pose-types'
import type { TmPoseLabel } from '@/types/study'
import type { LuxStatus, SessionLifecycle, StablePostureState, StudyStatus } from '@/types/study'

export type RuntimeControlMode = 'AI' | 'MOCK'

export type RawPostureState = 'GOOD' | 'BAD' | 'NO_POSE' | 'UNKNOWN'

export type BadPostureReason =
  | 'FORWARD_LEAN'
  | 'SIDE_LEAN'
  | 'RESTING'
  | 'BASELINE_DEVIATION'

export interface TmPoseSignal {
  timestampMs: number
  label: TmPoseLabel | null
  confidence: number
  probabilities: Record<TmPoseLabel, number>
  inferenceMs: number
  modelVersion: string
}

export interface MediaPipePostureSignal {
  timestampMs: number
  poseDetected: boolean
  deviationScore: number | null
  deviationReasons: DeviationReason[]
  inferenceMs: number
  calibrationAvailable: boolean
}

export interface FusedPostureObservation {
  timestampMs: number
  rawState: RawPostureState
  badReason: BadPostureReason | null
  tmLabel: TmPoseLabel | null
  tmConfidence: number | null
  tmFresh: boolean
  poseDetected: boolean
  mediaPipeFresh: boolean
  deviationScore: number | null
  deviationReasons: DeviationReason[]
  reasonCode:
    | 'NO_POSE'
    | 'TM_NOT_READY'
    | 'TM_STALE'
    | 'MEDIAPIPE_STALE'
    | 'TM_LOW_CONFIDENCE'
    | 'TM_BAD_CLASS'
    | 'TM_GOOD_MEDIAPIPE_NORMAL'
    | 'TM_GOOD_MEDIAPIPE_DEVIATED'
    | 'CALIBRATION_REQUIRED'
    | 'UNKNOWN'
}

export interface PostureHistoryEntry {
  timestampMs: number
  rawState: RawPostureState
  badReason: BadPostureReason | null
}

export interface StablePostureSnapshot {
  timestampMs: number
  state: StablePostureState
  badReason: BadPostureReason | null
  confidence: number | null
  changedAtMs: number
  stateDurationMs: number
  isTransitioning: boolean
  candidateState: StablePostureState | null
  candidateDurationMs: number
  history: PostureHistoryEntry[]
  consensusCount: number
}

export interface StableLuxSnapshot {
  timestampMs: number
  lux: number
  status: LuxStatus
  changedAtMs: number
  stateDurationMs: number
  isTransitioning: boolean
  candidateStatus: LuxStatus | null
  candidateDurationMs: number
}

export type RuntimeBlockingReason =
  | 'CAMERA_NOT_READY'
  | 'MEDIAPIPE_NOT_READY'
  | 'TM_NOT_READY'
  | 'CALIBRATION_REQUIRED'
  | 'MODEL_ERROR'
  | 'CAMERA_ERROR'

export type AlertEventType = 'POSTURE' | 'LUX_DARK' | 'LUX_TOO_BRIGHT'

export interface RuntimeAlertEvent {
  type: AlertEventType
  timestampMs: number
  title: string
  message: string
  badReason: BadPostureReason | null
}

export interface RuntimeSnapshot {
  mode: RuntimeControlMode
  fusedObservation: FusedPostureObservation | null
  stablePosture: StablePostureSnapshot
  stableLux: StableLuxSnapshot
  studyStatus: StudyStatus
  runtimeReady: boolean
  blockingReason: RuntimeBlockingReason | null
  effectiveTimeEligible: boolean
  timerPosture: StablePostureState
}

export interface RuntimeControllerTickResult {
  snapshot: RuntimeSnapshot
  alerts: RuntimeAlertEvent[]
}

export interface StudyStatusResolverInput {
  lifecycle: SessionLifecycle
  posture: StablePostureState
  luxStatus: LuxStatus
}
