import { openDB, type IDBPDatabase } from 'idb'

import { STUDYLOG_DB_NAME, STUDYLOG_DB_VERSION, type StudylogDbSchema } from '@/data/db/db-schema'
import { StudylogDbError } from '@/data/db/db-errors'

let databasePromise: Promise<IDBPDatabase<StudylogDbSchema>> | null = null

export function openStudylogDb(): Promise<IDBPDatabase<StudylogDbSchema>> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new StudylogDbError('UNAVAILABLE', '이 브라우저에서는 로컬 기록 저장소를 사용할 수 없습니다.'))
  }
  databasePromise ??= openDB<StudylogDbSchema>(STUDYLOG_DB_NAME, STUDYLOG_DB_VERSION, {
    upgrade(database, oldVersion) {
      if (oldVersion < 1) {
        const sessions = database.createObjectStore('sessions', { keyPath: 'id' })
        sessions.createIndex('by-status', 'status')
        sessions.createIndex('by-started-at', 'startedAtIso')
        sessions.createIndex('by-local-date', 'localDateKey')
        sessions.createIndex('by-subject', 'subject')
        sessions.createIndex('by-session-kind', 'sessionKind')

        const samples = database.createObjectStore('sessionSamples', { keyPath: 'id' })
        samples.createIndex('by-session-id', 'sessionId')
        samples.createIndex('by-session-and-sequence', ['sessionId', 'sequence'])
        samples.createIndex('by-timestamp', 'timestampIso')

        const evaluations = database.createObjectStore('evaluationRecords', { keyPath: 'id' })
        evaluations.createIndex('by-created-at', 'createdAtIso')
        evaluations.createIndex('by-participant-code', 'participantCode')
        evaluations.createIndex('by-actual-label', 'actualLabel')
        evaluations.createIndex('by-model-version', 'modelVersion')
      }
    },
  }).catch((error) => {
    databasePromise = null
    throw new StudylogDbError('OPEN_FAILED', '로컬 기록 저장소를 열지 못했습니다.', { cause: error })
  })
  return databasePromise
}

export function resetStudylogDbConnectionForTests(): void {
  databasePromise = null
}
