import type { CalibrationProfile } from '@/ai/pose-types'

export const CALIBRATION_STORAGE_KEY = 'studylog:calibration:v1'

export function loadCalibrationProfile(storage: Storage = localStorage): CalibrationProfile | null {
  try {
    const raw = storage.getItem(CALIBRATION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CalibrationProfile
    return parsed.version === 1 && parsed.baseline ? parsed : null
  } catch {
    return null
  }
}

export function saveCalibrationProfile(
  profile: CalibrationProfile,
  storage: Storage = localStorage,
): void {
  storage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify(profile))
}

export function clearCalibrationProfile(storage: Storage = localStorage): void {
  storage.removeItem(CALIBRATION_STORAGE_KEY)
}
