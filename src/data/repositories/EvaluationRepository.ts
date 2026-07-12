import { StudylogDbError, toStudylogDbError } from '@/data/db/db-errors'
import { openStudylogDb } from '@/data/db/studylog-db'
import { evaluationRecordSchema } from '@/data/db/validation'
import type { EvaluationRecord } from '@/data/evaluation/evaluation-types'

export class EvaluationRepository {
  async add(record: EvaluationRecord): Promise<void> { try { await (await openStudylogDb()).put('evaluationRecords', evaluationRecordSchema.parse(record)) } catch (error) { throw this.wrap(error) } }
  async list(): Promise<EvaluationRecord[]> { try { return (await (await openStudylogDb()).getAll('evaluationRecords')).map((v) => evaluationRecordSchema.parse(v)).sort((a,b) => b.createdAtIso.localeCompare(a.createdAtIso)) } catch (error) { throw this.wrap(error) } }
  async delete(id: string): Promise<void> { try { await (await openStudylogDb()).delete('evaluationRecords', id) } catch (error) { throw toStudylogDbError(error) } }
  async clear(): Promise<void> { try { await (await openStudylogDb()).clear('evaluationRecords') } catch (error) { throw toStudylogDbError(error) } }
  private wrap(error: unknown): StudylogDbError { return error instanceof Error && error.name === 'ZodError' ? new StudylogDbError('VALIDATION_FAILED','평가 데이터가 올바르지 않습니다.',{cause:error}) : toStudylogDbError(error) }
}
export const evaluationRepository = new EvaluationRepository()
