import type { SessionRepository } from '@/data/repositories/SessionRepository'
import { buildSessionSample } from '@/data/session/build-session-sample'
import { createRecordId, toLocalDateKey } from '@/data/session/session-data-config'
import { resolveSessionKind, SessionSummaryBuilder } from '@/data/session/SessionSummaryBuilder'
import type { SessionRecordingSnapshot, SessionStartContext, SessionSummary } from '@/data/session/session-data-types'
import { EMPTY_SESSION_DURATIONS } from '@/types/study'

export class SessionRecorder {
  private session: SessionSummary | null = null
  private sequence = 0
  private queue: Promise<void> = Promise.resolve()
  private finishing: Promise<SessionSummary> | null = null
  private lastSampleSecond = -1
  private readonly summaryBuilder = new SessionSummaryBuilder()
  constructor(private readonly repository: SessionRepository) {}

  async start(context: SessionStartContext): Promise<string> {
    if (this.session?.status === 'ACTIVE') return this.session.id
    const id = createRecordId('session')
    this.session = { schemaVersion:1,id,status:'ACTIVE',sessionKind:context.controlMode,subject:context.subject,goalMinutes:context.goalMinutes,
      startedAtIso:context.nowIso,endedAtIso:null,localDateKey:toLocalDateKey(new Date(context.nowIso)),timezoneOffsetMinutes:new Date(context.nowIso).getTimezoneOffset(),
      initialControlMode:context.controlMode,controlModesUsed:[context.controlMode],countLuxInEffectiveTime:context.countLuxInEffectiveTime,
      modelVersions:context.modelVersion?[context.modelVersion]:[],calibrationProfileId:context.calibrationProfileId,...EMPTY_SESSION_DURATIONS,
      goodPostureRatio:null,recommendedLuxRatio:null,effectiveStudyRatio:null,goalProgressRatio:0,averageLux:null,minimumLux:null,maximumLux:null,
      dominantBadPostureReason:null,sampleCount:0,createdAtIso:context.nowIso,updatedAtIso:context.nowIso }
    const initialSession = this.session
    await this.enqueue(() => this.repository.createSession(initialSession))
    return id
  }

  async sample(snapshot: SessionRecordingSnapshot): Promise<void> {
    if (!this.session || snapshot.lifecycle !== 'RUNNING') return
    const second = Math.floor(snapshot.durations.totalSessionMs / 1_000)
    if (second === this.lastSampleSecond) return
    this.lastSampleSecond = second
    this.track(snapshot)
    const sample = buildSessionSample(this.session.id, this.sequence++, resolveSessionKind(this.session.controlModesUsed), snapshot)
    await this.enqueue(() => this.repository.appendSample(sample))
  }
  async checkpoint(snapshot: SessionRecordingSnapshot): Promise<void> { if (!this.session) return; this.track(snapshot); this.session = {...this.session,...snapshot.durations,updatedAtIso:snapshot.nowIso,sessionKind:resolveSessionKind(this.session.controlModesUsed)}; await this.enqueue(() => this.repository.updateSession(this.session!)) }
  pause(snapshot: SessionRecordingSnapshot): Promise<void> { return this.checkpoint(snapshot) }
  resume(snapshot: SessionRecordingSnapshot): Promise<void> { this.track(snapshot); return this.checkpoint(snapshot) }
  finish(snapshot: SessionRecordingSnapshot): Promise<SessionSummary> {
    if (this.finishing) return this.finishing
    this.finishing = this.finishOnce(snapshot)
    return this.finishing
  }
  private async finishOnce(snapshot: SessionRecordingSnapshot): Promise<SessionSummary> {
    if (!this.session) throw new Error('진행 중인 기록 세션이 없습니다.')
    await this.checkpoint(snapshot); await this.queue
    const samples = await this.repository.getSamples(this.session.id)
    const summary = this.summaryBuilder.build({id:this.session.id,status:'COMPLETED',startedAtIso:this.session.startedAtIso,endedAtIso:snapshot.nowIso,
      subject:snapshot.subject,goalMinutes:snapshot.goalMinutes,initialControlMode:this.session.initialControlMode,controlModesUsed:this.session.controlModesUsed,
      countLuxInEffectiveTime:snapshot.countLuxInEffectiveTime,calibrationProfileId:snapshot.calibrationProfileId,durations:snapshot.durations,samples,
      createdAtIso:this.session.createdAtIso,updatedAtIso:snapshot.nowIso})
    await this.repository.updateSession(summary); this.session = summary; return summary
  }
  async discard(): Promise<void> { if (this.session) { const id=this.session.id; await this.queue; await this.repository.deleteSession(id) } this.session=null }
  async dispose(): Promise<void> { await this.queue }
  getSessionId(): string | null { return this.session?.id ?? null }
  private track(snapshot: SessionRecordingSnapshot): void { if (!this.session) return; if (!this.session.controlModesUsed.includes(snapshot.controlMode)) this.session.controlModesUsed.push(snapshot.controlMode); if (snapshot.modelVersion && !this.session.modelVersions.includes(snapshot.modelVersion)) this.session.modelVersions.push(snapshot.modelVersion) }
  private async enqueue(write: () => Promise<void>): Promise<void> { const next=this.queue.then(write); this.queue=next.catch(()=>undefined); return next }
}
