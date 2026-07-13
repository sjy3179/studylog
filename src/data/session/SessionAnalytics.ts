import type { SessionSummary } from '@/data/session/session-data-types'

export class SessionAnalytics {
  filter(sessions: SessionSummary[], includeDemo=false): SessionSummary[] { return sessions.filter((s)=>['COMPLETED','INTERRUPTED'].includes(s.status)).filter((s)=>includeDemo||s.sessionKind==='AI') }
  aggregateDaily(sessions: SessionSummary[], localDateKey: string) { return this.sum(sessions.filter((s)=>s.localDateKey===localDateKey)) }
  aggregateWeekly(sessions: SessionSummary[], date: Date) {
    const monday=new Date(date); const day=(monday.getDay()+6)%7; monday.setDate(monday.getDate()-day); monday.setHours(0,0,0,0)
    return Array.from({length:7},(_,index)=>{const current=new Date(monday);current.setDate(monday.getDate()+index);const key=`${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}-${String(current.getDate()).padStart(2,'0')}`;return {localDateKey:key,...this.aggregateDaily(sessions,key)}})
  }
  aggregateBySubject(sessions: SessionSummary[]) { const map=new Map<string,{effectiveStudyMs:number;sessionCount:number}>(); for(const s of sessions){const key=s.subject||'미지정';const value=map.get(key)??{effectiveStudyMs:0,sessionCount:0};value.effectiveStudyMs+=s.effectiveStudyMs;value.sessionCount++;map.set(key,value)} return [...map].map(([subject,value])=>({subject,...value})).sort((a,b)=>b.effectiveStudyMs-a.effectiveStudyMs) }
  sum(sessions: SessionSummary[]) { const effectiveStudyMs=sessions.reduce((n,s)=>n+s.effectiveStudyMs,0); const goal=sessions.reduce((n,s)=>n+s.goalMinutes*60_000,0); const weighted=(key:'recommendedLuxRatio'|'goodPostureRatio')=>{const valid=sessions.filter((s)=>s[key]!==null);return valid.length?valid.reduce((n,s)=>n+s[key]!,0)/valid.length:null};return {sessionCount:sessions.length,effectiveStudyMs,goalProgressRatio:goal?effectiveStudyMs/goal:0,recommendedLuxRatio:weighted('recommendedLuxRatio'),goodPostureRatio:weighted('goodPostureRatio')}}
}
