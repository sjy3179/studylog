import { DEVIATION_THRESHOLDS, DEVIATION_WEIGHTS } from '@/ai/pose-config'
import { clamp } from '@/ai/pose-statistics'
import type { CalibrationProfile, DeviationReason, PostureDeviation, PostureFeatures } from '@/ai/pose-types'

export class PostureDeviationAnalyzer {
  analyze(current: PostureFeatures, calibration: CalibrationProfile): PostureDeviation {
    const baseline = calibration.baseline
    const faceScaleDelta =
      current.faceScaleRatio !== null &&
      baseline.faceScaleRatio !== null &&
      baseline.faceScaleRatio > 0
        ? clamp(current.faceScaleRatio / baseline.faceScaleRatio - 1, -1, 1)
        : null
    const headDropDelta = clamp(
      baseline.noseToShoulderVerticalRatio - current.noseToShoulderVerticalRatio,
      -1,
      1,
    )
    const shoulderTiltDelta = clamp(
      current.shoulderTiltRatio - baseline.shoulderTiltRatio,
      -1,
      1,
    )
    const horizontalOffsetDelta = clamp(
      current.headHorizontalOffsetRatio - baseline.headHorizontalOffsetRatio,
      -1,
      1,
    )
    const reasons: DeviationReason[] = []
    if (faceScaleDelta !== null && faceScaleDelta >= DEVIATION_THRESHOLDS.faceScaleDelta) {
      reasons.push('FACE_MOVED_CLOSER')
    }
    if (headDropDelta >= DEVIATION_THRESHOLDS.headDropDelta) reasons.push('HEAD_DROPPED')
    if (shoulderTiltDelta >= DEVIATION_THRESHOLDS.shoulderTiltDelta) reasons.push('SHOULDER_TILTED')
    if (horizontalOffsetDelta >= DEVIATION_THRESHOLDS.horizontalOffsetDelta) reasons.push('BODY_SHIFTED')

    const weightedParts: Array<{ value: number; weight: number }> = []
    if (faceScaleDelta !== null) {
      weightedParts.push({
        value: clamp(faceScaleDelta / DEVIATION_THRESHOLDS.faceScaleDelta, 0, 1),
        weight: DEVIATION_WEIGHTS.faceScale,
      })
    }
    weightedParts.push(
      {
        value: clamp(headDropDelta / DEVIATION_THRESHOLDS.headDropDelta, 0, 1),
        weight: DEVIATION_WEIGHTS.headDrop,
      },
      {
        value: clamp(shoulderTiltDelta / DEVIATION_THRESHOLDS.shoulderTiltDelta, 0, 1),
        weight: DEVIATION_WEIGHTS.shoulderTilt,
      },
      {
        value: clamp(horizontalOffsetDelta / DEVIATION_THRESHOLDS.horizontalOffsetDelta, 0, 1),
        weight: DEVIATION_WEIGHTS.horizontalOffset,
      },
    )
    const totalWeight = weightedParts.reduce((total, part) => total + part.weight, 0)
    const score = clamp(
      weightedParts.reduce((total, part) => total + part.value * part.weight, 0) / totalWeight,
      0,
      1,
    )

    return {
      score,
      level: score < 0.35 ? 'LOW' : score < 0.65 ? 'MEDIUM' : 'HIGH',
      reasons,
      metrics: { faceScaleDelta, headDropDelta, shoulderTiltDelta, horizontalOffsetDelta },
    }
  }
}
