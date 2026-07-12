import { POSE_VALIDATION_CONFIG } from '@/ai/pose-config'
import { POSE_LANDMARK_INDEX } from '@/ai/pose-landmark-index'
import type { NormalizedPoseLandmark, PoseFrameResult, PostureFeatures } from '@/ai/pose-types'
import { distance2d, isLandmarkReliable } from '@/ai/pose-validation'

function normalizedDistance(
  landmark: NormalizedPoseLandmark | undefined,
  reference: NormalizedPoseLandmark,
  shoulderWidth: number,
): number | null {
  if (!isLandmarkReliable(landmark)) return null
  const value = distance2d(landmark, reference) / shoulderWidth
  return Number.isFinite(value) ? value : null
}

export class PoseFeatureExtractor {
  extract(result: PoseFrameResult): PostureFeatures | null {
    if (!result.detected || result.landmarks.length !== 33) return null

    const landmarks = result.landmarks
    const nose = landmarks[POSE_LANDMARK_INDEX.NOSE]
    const leftShoulder = landmarks[POSE_LANDMARK_INDEX.LEFT_SHOULDER]
    const rightShoulder = landmarks[POSE_LANDMARK_INDEX.RIGHT_SHOULDER]
    if (
      !isLandmarkReliable(nose) ||
      !isLandmarkReliable(leftShoulder) ||
      !isLandmarkReliable(rightShoulder)
    ) {
      return null
    }

    const shoulderWidth = distance2d(leftShoulder, rightShoulder)
    if (
      shoulderWidth < POSE_VALIDATION_CONFIG.minShoulderWidth ||
      !Number.isFinite(shoulderWidth)
    ) {
      return null
    }

    const shoulderCenter = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
    }
    const leftEar = landmarks[POSE_LANDMARK_INDEX.LEFT_EAR]
    const rightEar = landmarks[POSE_LANDMARK_INDEX.RIGHT_EAR]
    const leftEyeOuter = landmarks[POSE_LANDMARK_INDEX.LEFT_EYE_OUTER]
    const rightEyeOuter = landmarks[POSE_LANDMARK_INDEX.RIGHT_EYE_OUTER]

    let faceScaleRatio: number | null = null
    if (isLandmarkReliable(leftEar) && isLandmarkReliable(rightEar)) {
      faceScaleRatio = distance2d(leftEar, rightEar) / shoulderWidth
    } else if (isLandmarkReliable(leftEyeOuter) && isLandmarkReliable(rightEyeOuter)) {
      faceScaleRatio = distance2d(leftEyeOuter, rightEyeOuter) / shoulderWidth
    }

    const features: PostureFeatures = {
      shoulderWidth,
      noseToShoulderVerticalRatio: (shoulderCenter.y - nose.y) / shoulderWidth,
      shoulderTiltRatio: Math.abs(leftShoulder.y - rightShoulder.y) / shoulderWidth,
      headHorizontalOffsetRatio: Math.abs(nose.x - shoulderCenter.x) / shoulderWidth,
      faceScaleRatio: faceScaleRatio !== null && Number.isFinite(faceScaleRatio) ? faceScaleRatio : null,
      leftWristToFaceRatio: normalizedDistance(
        landmarks[POSE_LANDMARK_INDEX.LEFT_WRIST],
        nose,
        shoulderWidth,
      ),
      rightWristToFaceRatio: normalizedDistance(
        landmarks[POSE_LANDMARK_INDEX.RIGHT_WRIST],
        nose,
        shoulderWidth,
      ),
    }

    return Object.values(features).every((value) => value === null || Number.isFinite(value))
      ? features
      : null
  }
}
