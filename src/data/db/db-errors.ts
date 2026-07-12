export type StudylogDbErrorCode = 'UNAVAILABLE' | 'OPEN_FAILED' | 'QUOTA_EXCEEDED' | 'VALIDATION_FAILED' | 'TRANSACTION_FAILED' | 'NOT_FOUND' | 'UNKNOWN'

export class StudylogDbError extends Error {
  constructor(public readonly code: StudylogDbErrorCode, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'StudylogDbError'
  }
}

export function toStudylogDbError(error: unknown): StudylogDbError {
  if (error instanceof StudylogDbError) return error
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    return new StudylogDbError('QUOTA_EXCEEDED', '브라우저 기록 저장 공간이 부족합니다.', { cause: error })
  }
  return new StudylogDbError('TRANSACTION_FAILED', '로컬 기록을 저장하거나 불러오지 못했습니다.', { cause: error })
}
