import { POSE_VALIDATION_CONFIG } from '@/ai/pose-config'
import { POSE_LANDMARK_INDEX, REQUIRED_POSE_LANDMARKS } from '@/ai/pose-landmark-index'
import type { NormalizedPoseLandmark } from '@/ai/pose-types'

function finiteLandmark(landmark: NormalizedPoseLandmark | undefined): landmark is NormalizedPoseLandmark {
  return Boolean(
    landmark &&
      Number.isFinite(landmark.x) &&
      Number.isFinite(landmark.y) &&
      Number.isFinite(landmark.z),
  )
}

export function isLandmarkReliable(
  landmark: NormalizedPoseLandmark | undefined,
): landmark is NormalizedPoseLandmark {
  if (!finiteLandmark(landmark)) return false
  if (
    landmark.visibility !== null &&
    landmark.visibility < POSE_VALIDATION_CONFIG.minVisibility
  ) {
    return false
  }
  if (
    landmark.presence !== null &&
    landmark.presence < POSE_VALIDATION_CONFIG.minPresence
  ) {
    return false
  }
  return true
}

export function distance2d(
  first: Pick<NormalizedPoseLandmark, 'x' | 'y'>,
  second: Pick<NormalizedPoseLandmark, 'x' | 'y'>,
): number {
  return Math.hypot(first.x - second.x, first.y - second.y)
}

export interface PoseValidationResult {
  detected: boolean
  validLandmarkCount: number
}

export function validatePoseLandmarks(
  landmarks: NormalizedPoseLandmark[],
): PoseValidationResult {
  const validLandmarkCount = landmarks.filter(isLandmarkReliable).length
  if (landmarks.length !== 33) return { detected: false, validLandmarkCount }
  if (!REQUIRED_POSE_LANDMARKS.every((index) => isLandmarkReliable(landmarks[index]))) {
    return { detected: false, validLandmarkCount }
  }

  const leftShoulder = landmarks[POSE_LANDMARK_INDEX.LEFT_SHOULDER]
  const rightShoulder = landmarks[POSE_LANDMARK_INDEX.RIGHT_SHOULDER]
  const shoulderWidth = distance2d(leftShoulder, rightShoulder)

  return {
    detected: shoulderWidth >= POSE_VALIDATION_CONFIG.minShoulderWidth,
    validLandmarkCount,
  }
}
