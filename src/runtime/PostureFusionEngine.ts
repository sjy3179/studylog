import {
  DEFAULT_POSTURE_FUSION_CONFIG,
  type PostureFusionConfig,
} from '@/runtime/runtime-config'
import type {
  BadPostureReason,
  FusedPostureObservation,
  MediaPipePostureSignal,
  TmPoseSignal,
} from '@/runtime/runtime-types'

function isFresh(nowMs: number, timestampMs: number, maxAgeMs: number): boolean {
  const age = Math.max(0, nowMs - timestampMs)
  return age <= maxAgeMs
}

export class PostureFusionEngine {
  constructor(private readonly config: PostureFusionConfig = DEFAULT_POSTURE_FUSION_CONFIG) {}

  fuse(input: {
    nowMs: number
    tmPrediction: TmPoseSignal | null
    mediaPipeSignal: MediaPipePostureSignal | null
  }): FusedPostureObservation {
    const { nowMs, tmPrediction, mediaPipeSignal } = input
    const mediaPipeFresh = Boolean(
      mediaPipeSignal &&
        isFresh(nowMs, mediaPipeSignal.timestampMs, this.config.freshness.mediaPipeMaxAgeMs),
    )
    const tmFresh = Boolean(
      tmPrediction && isFresh(nowMs, tmPrediction.timestampMs, this.config.freshness.tmMaxAgeMs),
    )
    const base = {
      timestampMs: mediaPipeFresh && mediaPipeSignal ? mediaPipeSignal.timestampMs : nowMs,
      badReason: null,
      tmLabel: tmPrediction?.label ?? null,
      tmConfidence: tmPrediction?.confidence ?? null,
      tmFresh,
      poseDetected: mediaPipeSignal?.poseDetected ?? false,
      mediaPipeFresh,
      deviationScore: mediaPipeSignal?.deviationScore ?? null,
      deviationReasons: mediaPipeSignal?.deviationReasons ?? [],
    } satisfies Omit<FusedPostureObservation, 'rawState' | 'reasonCode'>

    if (!mediaPipeSignal || !mediaPipeFresh) {
      return { ...base, rawState: 'UNKNOWN', reasonCode: 'MEDIAPIPE_STALE' }
    }
    if (!mediaPipeSignal.poseDetected) {
      return { ...base, rawState: 'NO_POSE', reasonCode: 'NO_POSE' }
    }
    if (!tmPrediction) {
      return { ...base, rawState: 'UNKNOWN', reasonCode: 'TM_NOT_READY' }
    }
    if (!tmFresh) {
      return { ...base, rawState: 'UNKNOWN', reasonCode: 'TM_STALE' }
    }
    if (!tmPrediction.label || tmPrediction.confidence < this.config.tmMinimumConfidence) {
      return { ...base, rawState: 'UNKNOWN', reasonCode: 'TM_LOW_CONFIDENCE' }
    }

    const badReason = this.toBadReason(tmPrediction.label)
    if (badReason) {
      return { ...base, badReason, rawState: 'BAD', reasonCode: 'TM_BAD_CLASS' }
    }
    if (this.config.requireCalibrationForGood && !mediaPipeSignal.calibrationAvailable) {
      return { ...base, rawState: 'UNKNOWN', reasonCode: 'CALIBRATION_REQUIRED' }
    }
    if (mediaPipeSignal.deviationScore === null) {
      return { ...base, rawState: 'UNKNOWN', reasonCode: 'UNKNOWN' }
    }
    if (mediaPipeSignal.deviationScore >= this.config.mediaPipeBadDeviationThreshold) {
      return {
        ...base,
        badReason: 'BASELINE_DEVIATION',
        rawState: 'BAD',
        reasonCode: 'TM_GOOD_MEDIAPIPE_DEVIATED',
      }
    }
    return { ...base, rawState: 'GOOD', reasonCode: 'TM_GOOD_MEDIAPIPE_NORMAL' }
  }

  private toBadReason(label: TmPoseSignal['label']): BadPostureReason | null {
    if (label === 'FORWARD_LEAN' || label === 'SIDE_LEAN' || label === 'RESTING') return label
    return null
  }
}
