import type { DBSchema } from 'idb'

import type { EvaluationRecord } from '@/data/evaluation/evaluation-types'
import type { SessionSample, SessionSummary } from '@/data/session/session-data-types'

export const STUDYLOG_DB_NAME = 'studylog-db'
export const STUDYLOG_DB_VERSION = 1

export interface StudylogDbSchema extends DBSchema {
  sessions: {
    key: string
    value: SessionSummary
    indexes: {
      'by-status': SessionSummary['status']
      'by-started-at': string
      'by-local-date': string
      'by-subject': string
      'by-session-kind': SessionSummary['sessionKind']
    }
  }
  sessionSamples: {
    key: string
    value: SessionSample
    indexes: {
      'by-session-id': string
      'by-session-and-sequence': [string, number]
      'by-timestamp': string
    }
  }
  evaluationRecords: {
    key: string
    value: EvaluationRecord
    indexes: {
      'by-created-at': string
      'by-participant-code': string
      'by-actual-label': EvaluationRecord['actualLabel']
      'by-model-version': string
    }
  }
}
