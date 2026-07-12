import type { TmPoseErrorCode } from '@/ai/tm-pose/tm-pose-types'

export class TmPoseError extends Error {
  readonly assetUrl: string | null
  readonly code: TmPoseErrorCode

  constructor(code: TmPoseErrorCode, message: string, assetUrl: string | null = null) {
    super(message)
    this.name = 'TmPoseError'
    this.code = code
    this.assetUrl = assetUrl
  }
}

export function toTmPoseError(
  error: unknown,
  fallbackCode: TmPoseErrorCode,
  assetUrl: string | null = null,
): TmPoseError {
  if (error instanceof TmPoseError) return error
  const message = error instanceof Error ? error.message : '알 수 없는 TM Pose 오류가 발생했습니다.'
  const converted = new TmPoseError(fallbackCode, message, assetUrl)
  if (error instanceof Error && error.stack) converted.stack = error.stack
  return converted
}
