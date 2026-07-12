import { useCallback, useEffect, useState } from 'react'
import { sessionRepository } from '@/data/repositories/SessionRepository'
import type { SessionSummary } from '@/data/session/session-data-types'
export function useSessionRecords(includeDemo=false){const[data,setData]=useState<SessionSummary[]>([]);const[status,setStatus]=useState<'LOADING'|'READY'|'ERROR'>('LOADING');const reload=useCallback(async()=>{setStatus('LOADING');try{setData(await sessionRepository.listSessions({statuses:['COMPLETED','INTERRUPTED'],includeDemo}));setStatus('READY')}catch{setStatus('ERROR')}},[includeDemo]);useEffect(()=>{queueMicrotask(()=>void reload())},[reload]);return{data,status,reload}}
