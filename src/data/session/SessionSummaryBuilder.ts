import type { BadPostureReason, RuntimeControlMode } from '@/runtime/runtime-types'
import type { SessionDurations } from '@/types/study'
import type { SessionKind, SessionSample, SessionSummary, StoredSessionStatus } from '@/data/session/session-data-types'
import { toLocalDateKey } from '@/data/session/session-data-config'

export interface SessionSummaryBuildInput {
  id: string; status: StoredSessionStatus; startedAtIso: string; endedAtIso: string | null; subject: string | null; goalMinutes: number
  initialControlMode: RuntimeControlMode; controlModesUsed: RuntimeControlMode[]; countLuxInEffectiveTime: boolean
  calibrationProfileId: string | null; durations: SessionDurations; samples: SessionSample[]; createdAtIso: string; updatedAtIso: string
}

export function resolveSessionKind(modes: RuntimeControlMode[]): SessionKind {
  const unique = new Set(modes)
  if (unique.size > 1) return 'MIXED'
  return unique.has('AI') ? 'AI' : 'MOCK'
}

export class SessionSummaryBuilder {
  build(input: SessionSummaryBuildInput): SessionSummary {
    const lux = input.samples.map((s) => s.lux).filter(Number.isFinite)
    const reasonCounts = new Map<BadPostureReason, number>()
    for (const sample of input.samples) if (sample.badPostureReason) reasonCounts.set(sample.badPostureReason, (reasonCounts.get(sample.badPostureReason) ?? 0) + 1)
    const dominantBadPostureReason = [...reasonCounts].sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null
    const models = [...new Set(input.samples.map((s) => s.modelVersion).filter((v): v is string => Boolean(v)))]
    const goodMs = Math.max(0, input.durations.seatedMs - input.durations.postureCautionMs)
    const recommendedMs = Math.max(0, input.durations.seatedMs - input.durations.luxCautionMs)
    return {
      schemaVersion: 1, id: input.id, status: input.status, sessionKind: resolveSessionKind(input.controlModesUsed), subject: input.subject,
      goalMinutes: input.goalMinutes, startedAtIso: input.startedAtIso, endedAtIso: input.endedAtIso,
      localDateKey: toLocalDateKey(new Date(input.startedAtIso)), timezoneOffsetMinutes: new Date(input.startedAtIso).getTimezoneOffset(),
      initialControlMode: input.initialControlMode, controlModesUsed: [...new Set(input.controlModesUsed)], countLuxInEffectiveTime: input.countLuxInEffectiveTime,
      modelVersions: models, calibrationProfileId: input.calibrationProfileId, ...input.durations,
      goodPostureRatio: input.durations.seatedMs > 0 ? goodMs / input.durations.seatedMs : null,
      recommendedLuxRatio: input.durations.seatedMs > 0 ? recommendedMs / input.durations.seatedMs : null,
      effectiveStudyRatio: input.durations.totalSessionMs > 0 ? input.durations.effectiveStudyMs / input.durations.totalSessionMs : null,
      goalProgressRatio: input.durations.effectiveStudyMs / (input.goalMinutes * 60_000), averageLux: lux.length ? lux.reduce((a,b) => a+b,0) / lux.length : null,
      minimumLux: lux.length ? Math.min(...lux) : null, maximumLux: lux.length ? Math.max(...lux) : null,
      dominantBadPostureReason, sampleCount: input.samples.length, createdAtIso: input.createdAtIso, updatedAtIso: input.updatedAtIso,
    }
  }
}
