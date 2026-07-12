import { describe, expect, it } from 'vitest'
import { SessionRecorder } from '@/data/session/SessionRecorder'
import type { SessionRepository } from '@/data/repositories/SessionRepository'
import type { SessionRecordingSnapshot, SessionSample, SessionSummary } from '@/data/session/session-data-types'

class FakeRepository {
  summary: SessionSummary | null = null
  samples: SessionSample[] = []
  async createSession(value: SessionSummary) { this.summary = value }
  async updateSession(value: SessionSummary) { this.summary = value }
  async appendSample(value: SessionSample) { this.samples.push(value) }
  async getSamples() { return this.samples }
  async deleteSession() { this.summary = null; this.samples = [] }
}
const durations=(totalSessionMs:number)=>({totalSessionMs,effectiveStudyMs:totalSessionMs,seatedMs:totalSessionMs,postureCautionMs:0,awayMs:0,luxCautionMs:0,checkingMs:0})
const snapshot=(total:number,lifecycle:'RUNNING'|'PAUSED',controlMode:'AI'|'MOCK'='AI'):SessionRecordingSnapshot=>({nowIso:new Date(2026,6,13,12,0,Math.floor(total/1000)).toISOString(),lifecycle,subject:'수학',goalMinutes:60,controlMode,countLuxInEffectiveTime:true,durations:durations(total),runtimeSnapshot:null,rawLux:620,modelVersion:'v1',calibrationProfileId:null})

describe('SessionRecorder',()=>{
  it('creates ACTIVE, samples only RUNNING, tracks MIXED and finishes once',async()=>{
    const repository=new FakeRepository();const recorder=new SessionRecorder(repository as unknown as SessionRepository)
    await recorder.start({subject:'수학',goalMinutes:60,controlMode:'AI',countLuxInEffectiveTime:true,modelVersion:'v1',calibrationProfileId:null,nowIso:new Date(2026,6,13,12).toISOString()})
    expect(repository.summary?.status).toBe('ACTIVE')
    await recorder.sample(snapshot(1000,'RUNNING'));await recorder.sample(snapshot(1000,'RUNNING'));await recorder.sample(snapshot(2000,'PAUSED'));await recorder.resume(snapshot(2000,'PAUSED','MOCK'));await recorder.sample(snapshot(3000,'RUNNING','MOCK'))
    expect(repository.samples.map((value)=>value.sequence)).toEqual([0,1])
    const first=recorder.finish(snapshot(3000,'PAUSED','MOCK'));const second=recorder.finish(snapshot(3000,'PAUSED','MOCK'))
    expect(first).toBe(second);expect((await first).sessionKind).toBe('MIXED');expect(repository.summary?.status).toBe('COMPLETED')
  })
})
