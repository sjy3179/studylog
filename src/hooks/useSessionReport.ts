import { useEffect, useState } from 'react'
import { sessionRepository } from '@/data/repositories/SessionRepository'
import type { SessionSample, SessionSummary } from '@/data/session/session-data-types'
export function useSessionReport(id:string|undefined){const[state,setState]=useState<{status:'LOADING'|'READY'|'NOT_FOUND'|'ERROR';summary:SessionSummary|null;samples:SessionSample[]}>({status:id?'LOADING':'NOT_FOUND',summary:null,samples:[]});useEffect(()=>{if(!id)return;queueMicrotask(()=>{void Promise.all([sessionRepository.getSession(id),sessionRepository.getSamples(id)]).then(([summary,samples])=>setState(summary?{status:'READY',summary,samples}:{status:'NOT_FOUND',summary:null,samples:[]})).catch(()=>setState({status:'ERROR',summary:null,samples:[]}))})},[id]);return state}
