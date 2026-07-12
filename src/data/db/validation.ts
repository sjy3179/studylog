import { z } from 'zod'

const nonNegative = z.number().finite().nonnegative()
const nullableRatio = z.number().finite().nonnegative().nullable()
const durationShape = {
  totalSessionMs: nonNegative,
  effectiveStudyMs: nonNegative,
  seatedMs: nonNegative,
  postureCautionMs: nonNegative,
  awayMs: nonNegative,
  luxCautionMs: nonNegative,
  checkingMs: nonNegative,
} as const

export const sessionSummarySchema = z.object({
  schemaVersion: z.literal(1), id: z.string().min(1), status: z.enum(['ACTIVE', 'COMPLETED', 'INTERRUPTED', 'DISCARDED']),
  sessionKind: z.enum(['AI', 'MOCK', 'MIXED']), subject: z.string().nullable(), goalMinutes: z.number().finite().positive(),
  startedAtIso: z.iso.datetime(), endedAtIso: z.iso.datetime().nullable(), localDateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timezoneOffsetMinutes: z.number().finite(), initialControlMode: z.enum(['AI', 'MOCK']), controlModesUsed: z.array(z.enum(['AI', 'MOCK'])).min(1),
  countLuxInEffectiveTime: z.boolean(), modelVersions: z.array(z.string()), calibrationProfileId: z.string().nullable(),
  ...durationShape, goodPostureRatio: nullableRatio, recommendedLuxRatio: nullableRatio, effectiveStudyRatio: nullableRatio,
  goalProgressRatio: nonNegative, averageLux: z.number().finite().nullable(), minimumLux: z.number().finite().nullable(), maximumLux: z.number().finite().nullable(),
  dominantBadPostureReason: z.enum(['FORWARD_LEAN', 'SIDE_LEAN', 'RESTING', 'BASELINE_DEVIATION']).nullable(), sampleCount: z.number().int().nonnegative(),
  createdAtIso: z.iso.datetime(), updatedAtIso: z.iso.datetime(),
})

export const sessionSampleSchema = z.object({
  schemaVersion: z.literal(1), id: z.string().min(1), sessionId: z.string().min(1), sequence: z.number().int().nonnegative(),
  timestampIso: z.iso.datetime(), elapsedMs: nonNegative, subject: z.string().nullable(), goalMinutes: z.number().finite().positive(),
  sessionKind: z.enum(['AI', 'MOCK', 'MIXED']), controlMode: z.enum(['AI', 'MOCK']), lifecycle: z.enum(['IDLE', 'RUNNING', 'PAUSED', 'FINISHED']),
  stablePostureState: z.enum(['GOOD', 'BAD', 'AWAY', 'UNKNOWN']), badPostureReason: z.enum(['FORWARD_LEAN', 'SIDE_LEAN', 'RESTING', 'BASELINE_DEVIATION']).nullable(),
  rawPostureState: z.enum(['GOOD', 'BAD', 'NO_POSE', 'UNKNOWN']).nullable(), studyStatus: z.enum(['STUDYING', 'POSTURE_CAUTION', 'LUX_CAUTION', 'MULTI_CAUTION', 'AWAY', 'CHECKING', 'PAUSED']),
  runtimeReady: z.boolean(), blockingReason: z.enum(['CAMERA_NOT_READY', 'MEDIAPIPE_NOT_READY', 'TM_NOT_READY', 'CALIBRATION_REQUIRED', 'MODEL_ERROR', 'CAMERA_ERROR']).nullable(),
  effectiveTimeEligible: z.boolean(), tmLabel: z.enum(['GOOD_POSTURE', 'FORWARD_LEAN', 'SIDE_LEAN', 'RESTING']).nullable(), tmConfidence: z.number().min(0).max(1).nullable(),
  tmGoodProbability: z.number().min(0).max(1).nullable(), tmForwardProbability: z.number().min(0).max(1).nullable(), tmSideProbability: z.number().min(0).max(1).nullable(), tmRestingProbability: z.number().min(0).max(1).nullable(), tmFresh: z.boolean(),
  poseDetected: z.boolean(), mediaPipeFresh: z.boolean(), deviationScore: z.number().finite().nullable(), deviationReasons: z.array(z.enum(['FACE_MOVED_CLOSER', 'HEAD_DROPPED', 'SHOULDER_TILTED', 'BODY_SHIFTED'])),
  lux: z.number().finite(), luxStatus: z.enum(['DARK', 'RECOMMENDED', 'TOO_BRIGHT']), ...durationShape, modelVersion: z.string().nullable(), calibrationProfileId: z.string().nullable(),
})

export const evaluationRecordSchema = z.object({
  schemaVersion: z.literal(1), id: z.string().min(1), createdAtIso: z.iso.datetime(), participantCode: z.string().min(1),
  actualLabel: z.enum(['GOOD_POSTURE', 'FORWARD_LEAN', 'SIDE_LEAN', 'RESTING']), predictedLabel: z.enum(['GOOD_POSTURE', 'FORWARD_LEAN', 'SIDE_LEAN', 'RESTING']), correct: z.boolean(),
  averageConfidence: z.number().min(0).max(1), averageGoodProbability: z.number().min(0).max(1), averageForwardProbability: z.number().min(0).max(1), averageSideProbability: z.number().min(0).max(1), averageRestingProbability: z.number().min(0).max(1),
  validSampleCount: z.number().int().nonnegative(), rejectedSampleCount: z.number().int().nonnegative(), collectionDurationMs: nonNegative,
  modelVersion: z.string().min(1), mirrorCamera: z.boolean(), lightingCondition: z.enum(['BRIGHT', 'NORMAL', 'DIM']), cameraDistance: z.enum(['NEAR', 'NORMAL', 'FAR']), environmentNote: z.string(),
})
