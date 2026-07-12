import type { StudyStatus } from '@/types/study'
import type { StudyStatusResolverInput } from '@/runtime/runtime-types'

export function resolveStudyStatus(input: StudyStatusResolverInput): StudyStatus {
  if (input.lifecycle === 'PAUSED') return 'PAUSED'
  if (input.lifecycle === 'INITIALIZING' || input.lifecycle === 'CALIBRATING') return 'CHECKING'
  if (input.lifecycle !== 'RUNNING') return 'PAUSED'
  if (input.posture === 'UNKNOWN') return 'CHECKING'
  if (input.posture === 'AWAY') return 'AWAY'
  const postureCaution = input.posture === 'BAD'
  const luxCaution = input.luxStatus !== 'RECOMMENDED'
  if (postureCaution && luxCaution) return 'MULTI_CAUTION'
  if (postureCaution) return 'POSTURE_CAUTION'
  if (luxCaution) return 'LUX_CAUTION'
  return 'STUDYING'
}
