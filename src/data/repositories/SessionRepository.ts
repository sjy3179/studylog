import { StudylogDbError, toStudylogDbError } from '@/data/db/db-errors'
import { openStudylogDb } from '@/data/db/studylog-db'
import { sessionSampleSchema, sessionSummarySchema } from '@/data/db/validation'
import type { SessionSample, SessionSummary, StoredSessionStatus } from '@/data/session/session-data-types'

export interface SessionQuery { statuses?: StoredSessionStatus[]; includeDemo?: boolean }

export class SessionRepository {
  async createSession(summary: SessionSummary): Promise<void> { await this.writeSummary(summary, true) }
  async updateSession(summary: SessionSummary): Promise<void> { await this.writeSummary(summary, false) }
  async getSession(id: string): Promise<SessionSummary | null> {
    try { const value = await (await openStudylogDb()).get('sessions', id); return value ? sessionSummarySchema.parse(value) : null }
    catch (error) { throw this.wrapValidation(error) }
  }
  async listSessions(query: SessionQuery = {}): Promise<SessionSummary[]> {
    try {
      const values = (await (await openStudylogDb()).getAll('sessions')).map((value) => sessionSummarySchema.parse(value))
      return values.filter((value) => !query.statuses || query.statuses.includes(value.status)).filter((value) => query.includeDemo || value.sessionKind === 'AI').sort((a, b) => b.startedAtIso.localeCompare(a.startedAtIso))
    } catch (error) { throw this.wrapValidation(error) }
  }
  async appendSample(sample: SessionSample): Promise<void> {
    try { await (await openStudylogDb()).put('sessionSamples', sessionSampleSchema.parse(sample)) }
    catch (error) { throw this.wrapValidation(error) }
  }
  async appendSamples(samples: SessionSample[]): Promise<void> {
    try { const db = await openStudylogDb(); const tx = db.transaction('sessionSamples', 'readwrite'); for (const sample of samples) await tx.store.put(sessionSampleSchema.parse(sample)); await tx.done }
    catch (error) { throw this.wrapValidation(error) }
  }
  async getSamples(sessionId: string): Promise<SessionSample[]> {
    try { const values = await (await openStudylogDb()).getAllFromIndex('sessionSamples', 'by-session-id', sessionId); return values.map((value) => sessionSampleSchema.parse(value)).sort((a, b) => a.sequence - b.sequence) }
    catch (error) { throw this.wrapValidation(error) }
  }
  async findActiveSession(): Promise<SessionSummary | null> {
    try { const values = await (await openStudylogDb()).getAllFromIndex('sessions', 'by-status', 'ACTIVE'); const sorted = values.map((v) => sessionSummarySchema.parse(v)).sort((a,b) => b.startedAtIso.localeCompare(a.startedAtIso)); return sorted[0] ?? null }
    catch (error) { throw this.wrapValidation(error) }
  }
  async deleteSession(id: string): Promise<void> {
    try {
      const db = await openStudylogDb(); const tx = db.transaction(['sessions', 'sessionSamples'], 'readwrite');
      await tx.objectStore('sessions').delete(id); let cursor = await tx.objectStore('sessionSamples').index('by-session-id').openCursor(id)
      while (cursor) { await cursor.delete(); cursor = await cursor.continue() } await tx.done
    } catch (error) { throw toStudylogDbError(error) }
  }
  async clearAllSessions(): Promise<void> {
    try { const db = await openStudylogDb(); const tx = db.transaction(['sessions','sessionSamples'],'readwrite'); await tx.objectStore('sessions').clear(); await tx.objectStore('sessionSamples').clear(); await tx.done }
    catch (error) { throw toStudylogDbError(error) }
  }
  private async writeSummary(summary: SessionSummary, add: boolean): Promise<void> {
    try { const db = await openStudylogDb(); const parsed = sessionSummarySchema.parse(summary); if (add) await db.add('sessions', parsed); else await db.put('sessions', parsed) }
    catch (error) { throw this.wrapValidation(error) }
  }
  private wrapValidation(error: unknown): StudylogDbError { return error instanceof Error && error.name === 'ZodError' ? new StudylogDbError('VALIDATION_FAILED','저장할 기록 데이터가 올바르지 않습니다.',{cause:error}) : toStudylogDbError(error) }
}

export const sessionRepository = new SessionRepository()
