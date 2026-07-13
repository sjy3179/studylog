import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { sessionRepository } from '@/data/repositories/SessionRepository'
import { SessionRecorder } from '@/data/session/SessionRecorder'
import type { SessionRecordingSnapshot, SessionSummary } from '@/data/session/session-data-types'
import { useCalibrationStore, useStudySessionStore, useStudySettingsStore } from '@/stores/useStudyStore'

export function buildRecordingSnapshot(): SessionRecordingSnapshot {
  const session=useStudySessionStore.getState(); const settings=useStudySettingsStore.getState(); const calibration=useCalibrationStore.getState().profile
  return {nowIso:new Date().toISOString(),lifecycle:session.lifecycle,subject:settings.subject||null,goalMinutes:settings.goalMinutes,controlMode:session.controlMode,countLuxInEffectiveTime:settings.countLuxInEffectiveTime,durations:{...session.durations},runtimeSnapshot:session.runtimeSnapshot,rawLux:session.lux,modelVersion:session.runtimeSnapshot?.fusedObservation?.tmModelVersion??null,calibrationProfileId:calibration?.id??null}
}

export function useSessionRecorder(onFinished:(summary:SessionSummary)=>void) {
  const lifecycle=useStudySessionStore((s)=>s.lifecycle); const sessionRevision=useStudySessionStore((s)=>s.sessionRevision)
  const recorderRef=useRef<SessionRecorder|null>(null); const previousLifecycle=useRef(lifecycle); const [error,setError]=useState<string|null>(null)
  useEffect(()=>{const previous=previousLifecycle.current;previousLifecycle.current=lifecycle;const run=async()=>{try{
    if(lifecycle==='RUNNING'&&(previous==='IDLE'||previous==='FINISHED')){const recorder=new SessionRecorder(sessionRepository);recorderRef.current=recorder;const snapshot=buildRecordingSnapshot();await recorder.start({subject:snapshot.subject,goalMinutes:snapshot.goalMinutes,controlMode:snapshot.controlMode,countLuxInEffectiveTime:snapshot.countLuxInEffectiveTime,modelVersion:snapshot.modelVersion,calibrationProfileId:snapshot.calibrationProfileId,nowIso:snapshot.nowIso})}
    else if(lifecycle==='PAUSED'&&previous==='RUNNING') await recorderRef.current?.pause(buildRecordingSnapshot())
    else if(lifecycle==='RUNNING'&&previous==='PAUSED') await recorderRef.current?.resume(buildRecordingSnapshot())
    else if(lifecycle==='FINISHED'&&(previous==='RUNNING'||previous==='PAUSED')){const summary=await recorderRef.current?.finish(buildRecordingSnapshot());if(summary)onFinished(summary)}
  }catch(e){const message=e instanceof Error?e.message:'세션 기록을 저장하지 못했습니다.';setError(message);toast.warning('기록 저장에 문제가 있습니다.',{description:'타이머는 계속 사용할 수 있습니다.'})}};void run()},[lifecycle,onFinished,sessionRevision])
  useEffect(()=>{if(lifecycle!=='RUNNING')return;const id=window.setInterval(()=>{void recorderRef.current?.sample(buildRecordingSnapshot()).catch(()=>setError('일부 세션 샘플을 저장하지 못했습니다.'))},1000);return()=>window.clearInterval(id)},[lifecycle])
  const discard=useCallback(async()=>{await recorderRef.current?.discard();recorderRef.current=null},[])
  return { error, discard }
}
