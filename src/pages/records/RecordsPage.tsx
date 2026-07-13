import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Clock3, FileClock, ShieldCheck, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSessionRecords } from '@/hooks/useSessionRecords'
import { SessionAnalytics } from '@/data/session/SessionAnalytics'
import { sessionRepository } from '@/data/repositories/SessionRepository'
import { formatDuration } from '@/lib/format-duration'
import { toLocalDateKey } from '@/data/session/session-data-config'
import type { SessionSummary } from '@/data/session/session-data-types'

const percent = (value: number | null) => `${Math.round((value ?? 0) * 100)}%`

export function RecordsPage() {
  const [includeDemo, setIncludeDemo] = useState(false)
  const { data, status, reload } = useSessionRecords(includeDemo)
  const analytics = useMemo(() => new SessionAnalytics(), [])
  const daily = analytics.aggregateDaily(data, toLocalDateKey(new Date()))
  const weekly = analytics.aggregateWeekly(data, new Date())
  const subjects = analytics.aggregateBySubject(data)
  const metrics = [
    ['순공 시간', formatDuration(daily.effectiveStudyMs)],
    ['목표 달성률', percent(daily.goalProgressRatio)],
    ['적정 조도 유지율', percent(daily.recommendedLuxRatio)],
    ['기준 자세 유지율', percent(daily.goodPostureRatio)],
  ]
  const removeAll = async () => {
    if (!confirm('모든 학습 기록을 삭제할까요?')) return
    await sessionRepository.clearAllSessions()
    await reload()
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">Records</p><h1 className="mt-2 text-3xl font-semibold">학습 기록</h1><p className="mt-2 text-sm text-muted-foreground">이 브라우저의 IndexedDB에 저장된 실제 세션만 표시합니다.</p></div>
        <div className="flex flex-wrap items-center gap-3"><Switch aria-label="데모 기록 포함" checked={includeDemo} onCheckedChange={setIncludeDemo}/><span className="text-sm">데모 기록 포함</span><Button onClick={() => void removeAll()} variant="destructive"><Trash2 className="size-4"/>전체 삭제</Button></div>
      </header>

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value]) => <Card key={label}><CardContent className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 font-mono text-2xl font-semibold">{value}</p></CardContent></Card>)}
      </section>

      {status === 'ERROR' ? <p className="mt-8 text-destructive">기록을 불러오지 못했습니다.</p> : data.length === 0 ? (
        <Card className="mt-8 border-dashed"><CardContent className="grid min-h-72 place-items-center text-center"><div><FileClock className="mx-auto size-9 text-primary"/><h2 className="mt-4 font-semibold">아직 일간 기록이 없습니다</h2><p className="mt-2 text-sm text-muted-foreground">학습 세션을 종료하면 순공 시간과 자세·조도 조건 기록이 이곳에 표시됩니다.</p>{status === 'LOADING' ? <p className="mt-3 text-xs" role="status">기록을 불러오는 중입니다.</p> : null}</div></CardContent></Card>
      ) : (
        <Tabs className="mt-8" defaultValue="daily"><TabsList><TabsTrigger value="daily">일간</TabsTrigger><TabsTrigger value="weekly">주간</TabsTrigger><TabsTrigger value="subject">과목별</TabsTrigger></TabsList><TabsContent value="daily"><SessionList sessions={data}/></TabsContent><TabsContent value="weekly"><ChartCard title="주간 순공 시간" data={weekly.map((value) => ({ name: value.localDateKey.slice(5), minutes: Math.round(value.effectiveStudyMs / 60_000) }))}/></TabsContent><TabsContent value="subject"><ChartCard title="과목별 순공 시간" data={subjects.map((value) => ({ name: value.subject, minutes: Math.round(value.effectiveStudyMs / 60_000) }))}/></TabsContent></Tabs>
      )}
      <div className="mt-8 flex gap-3 rounded-xl bg-muted p-4 text-sm text-muted-foreground"><ShieldCheck className="size-5 shrink-0"/><p>학습 기록과 모델 평가 결과는 이 브라우저에만 저장됩니다. 영상·사진·얼굴 이미지와 원본 관절 좌표는 저장되지 않습니다.</p></div>
    </div>
  )
}

function SessionList({ sessions }: { sessions: SessionSummary[] }) {
  return <div className="mt-5 grid gap-3">{sessions.map((session) => <Link key={session.id} to={`/report/${session.id}`}><Card className="transition hover:border-primary"><CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><Clock3 className="size-4 text-primary"/><strong>{session.subject || '미지정'}</strong><span className="rounded-full bg-muted px-2 py-1 text-xs">{session.sessionKind}</span></div><p className="mt-2 text-xs text-muted-foreground">{new Date(session.startedAtIso).toLocaleString()} · {session.status}</p></div><p className="font-mono text-xl font-semibold">{formatDuration(session.effectiveStudyMs)}</p></CardContent></Card></Link>)}</div>
}

function ChartCard({ title, data }: { title: string; data: { name: string; minutes: number }[] }) {
  return <Card className="mt-5"><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent><div className="h-72 w-full"><ResponsiveContainer height="100%" width="100%"><BarChart data={data}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip/><Bar dataKey="minutes" fill="#4f46e5" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div></CardContent></Card>
}
