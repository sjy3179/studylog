import type { DeviationReason } from '@/ai/pose-types'
import type { BadPostureReason, RawPostureState, RuntimeBlockingReason, RuntimeControlMode } from '@/runtime/runtime-types'
import type { LuxStatus, SessionDurations, SessionLifecycle, StablePostureState, StudyStatus, TmPoseLabel } from '@/types/study'

export const DATA_SCHEMA_VERSION = 1 as const
export type SessionKind = 'AI' | 'MOCK' | 'MIXED'
export type StoredSessionStatus = 'ACTIVE' | 'COMPLETED' | 'INTERRUPTED' | 'DISCARDED'

export interface SessionSample extends SessionDurations {
  schemaVersion: 1
  id: string
  sessionId: string
  sequence: number
  timestampIso: string
  elapsedMs: number
  subject: string | null
  goalMinutes: number
  sessionKind: SessionKind
  controlMode: RuntimeControlMode
  lifecycle: SessionLifecycle
  stablePostureState: StablePostureState
  badPostureReason: BadPostureReason | null
  rawPostureState: RawPostureState | null
  studyStatus: StudyStatus
  runtimeReady: boolean
  blockingReason: RuntimeBlockingReason | null
  effectiveTimeEligible: boolean
  tmLabel: TmPoseLabel | null
  tmConfidence: number | null
  tmGoodProbability: number | null
  tmForwardProbability: number | null
  tmSideProbability: number | null
  tmRestingProbability: number | null
  tmFresh: boolean
  poseDetected: boolean
  mediaPipeFresh: boolean
  deviationScore: number | null
  deviationReasons: DeviationReason[]
  lux: number
  luxStatus: LuxStatus
  modelVersion: string | null
  calibrationProfileId: string | null
}

export interface SessionSummary extends SessionDurations {
  schemaVersion: 1
  id: string
  status: StoredSessionStatus
  sessionKind: SessionKind
  subject: string | null
  goalMinutes: number
  startedAtIso: string
  endedAtIso: string | null
  localDateKey: string
  timezoneOffsetMinutes: number
  initialControlMode: RuntimeControlMode
  controlModesUsed: RuntimeControlMode[]
  countLuxInEffectiveTime: boolean
  modelVersions: string[]
  calibrationProfileId: string | null
  goodPostureRatio: number | null
  recommendedLuxRatio: number | null
  effectiveStudyRatio: number | null
  goalProgressRatio: number
  averageLux: number | null
  minimumLux: number | null
  maximumLux: number | null
  dominantBadPostureReason: BadPostureReason | null
  sampleCount: number
  createdAtIso: string
  updatedAtIso: string
}

export interface SessionStartContext {
  subject: string | null
  goalMinutes: number
  controlMode: RuntimeControlMode
  countLuxInEffectiveTime: boolean
  modelVersion: string | null
  calibrationProfileId: string | null
  nowIso: string
}

export interface SessionRecordingSnapshot {
  nowIso: string
  lifecycle: SessionLifecycle
  subject: string | null
  goalMinutes: number
  controlMode: RuntimeControlMode
  countLuxInEffectiveTime: boolean
  durations: SessionDurations
  runtimeSnapshot: import('@/runtime/runtime-types').RuntimeSnapshot | null
  rawLux: number
  modelVersion: string | null
  calibrationProfileId: string | null
}
