import {
  Armchair,
  CheckCircle2,
  CirclePause,
  CirclePlay,
  Clock3,
  Eye,
  Info,
  Lightbulb,
  Pause,
  PersonStanding,
  RotateCcw,
  ScanFace,
  Sparkles,
  Square,
  SunMedium,
  Target,
  TriangleAlert,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDuration, formatMinutes } from '@/lib/format-duration'
import { cn } from '@/lib/utils'
import { getLuxStatus } from '@/sensors/LuxProvider'
import { deriveStudyStatus } from '@/state/StudyStateMachine'
import {
  useStudySessionStore,
  useStudySettingsStore,
} from '@/stores/useStudyStore'
import type { LuxStatus, StudyStatus } from '@/types/study'

const SUBJECTS = ['수학', '영어', '국어', '과학', '코딩', '기타'] as const
const GOALS = [30, 60, 90, 120, 180, 240] as const

interface StatusContent {
  label: string
  description: string
  className: string
  icon: typeof CheckCircle2
}

const STATUS_CONTENT: Record<StudyStatus, StatusContent> = {
  STUDYING: {
    label: '학습 중',
    description: '자세와 조도가 권장 조건을 충족하고 있어요.',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    icon: CheckCircle2,
  },
  POSTURE_CAUTION: {
    label: '자세 주의',
    description: '자세를 잠시 확인해 주세요. 순공 시간은 멈춰 있어요.',
    className: 'border-amber-200 bg-amber-50 text-amber-800',
    icon: PersonStanding,
  },
  LUX_CAUTION: {
    label: '조도 주의',
    description: '현재 밝기가 권장 범위를 벗어났어요.',
    className: 'border-amber-200 bg-amber-50 text-amber-800',
    icon: SunMedium,
  },
  MULTI_CAUTION: {
    label: '복합 주의',
    description: '자세와 조도를 함께 확인해 주세요.',
    className: 'border-orange-200 bg-orange-50 text-orange-800',
    icon: TriangleAlert,
  },
  AWAY: {
    label: '자리 비움',
    description: '자리를 비워 순공 타이머가 일시정지되었습니다.',
    className: 'border-slate-200 bg-slate-100 text-slate-700',
    icon: Armchair,
  },
  CHECKING: {
    label: '상태 확인 중',
    description: '안정적인 상태를 확인하고 있어요.',
    className: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    icon: Eye,
  },
  PAUSED: {
    label: '일시정지',
    description: '세션을 시작하면 조건에 따라 시간이 기록됩니다.',
    className: 'border-slate-200 bg-slate-50 text-slate-700',
    icon: Pause,
  },
}

const READY_STATUS_CONTENT: StatusContent = {
  label: '준비됨',
  description: '세션을 시작하면 조건에 따라 시간이 기록됩니다.',
  className: 'border-slate-200 bg-slate-50 text-slate-700',
  icon: Pause,
}

const FINISHED_STATUS_CONTENT: StatusContent = {
  label: '세션 완료',
  description: '기록을 확인하고 새 세션을 시작할 수 있어요.',
  className: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  icon: CheckCircle2,
}

const LUX_LABELS: Record<LuxStatus, string> = {
  DARK: '어두움',
  DIM: '다소 어두움',
  RECOMMENDED: '권장',
  BRIGHT: '밝음',
  TOO_BRIGHT: '매우 밝음',
}

function TimerDetail({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-muted/35 px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-base font-semibold tabular-nums">
        {formatDuration(value)}
      </p>
    </div>
  )
}

export function TodayPage() {
  const [searchParams] = useSearchParams()
  const lifecycle = useStudySessionStore((state) => state.lifecycle)
  const posture = useStudySessionStore((state) => state.posture)
  const lux = useStudySessionStore((state) => state.lux)
  const durations = useStudySessionStore((state) => state.durations)
  const finishSession = useStudySessionStore((state) => state.finishSession)
  const pauseSession = useStudySessionStore((state) => state.pauseSession)
  const resetSession = useStudySessionStore((state) => state.resetSession)
  const setLux = useStudySessionStore((state) => state.setLux)
  const setPosture = useStudySessionStore((state) => state.setPosture)
  const startSession = useStudySessionStore((state) => state.startSession)

  const countLuxInEffectiveTime = useStudySettingsStore(
    (state) => state.countLuxInEffectiveTime,
  )
  const goalMinutes = useStudySettingsStore((state) => state.goalMinutes)
  const setGoalMinutes = useStudySettingsStore((state) => state.setGoalMinutes)
  const setSubject = useStudySettingsStore((state) => state.setSubject)
  const subject = useStudySettingsStore((state) => state.subject)
  const timerVisibility = useStudySettingsStore((state) => state.timerVisibility)

  const luxStatus = getLuxStatus(lux)
  const derivedStatus = deriveStudyStatus({ lifecycle, posture, luxStatus })
  const statusContent =
    lifecycle === 'IDLE'
      ? READY_STATUS_CONTENT
      : lifecycle === 'FINISHED'
        ? FINISHED_STATUS_CONTENT
        : STATUS_CONTENT[derivedStatus]
  const StatusIcon = statusContent.icon
  const goalMs = goalMinutes * 60_000
  const goalProgress = Math.min(100, (durations.effectiveStudyMs / goalMs) * 100)
  const isRunning = lifecycle === 'RUNNING'
  const canFinish = lifecycle === 'RUNNING' || lifecycle === 'PAUSED'
  const isFinished = lifecycle === 'FINISHED'
  const demoExpanded = searchParams.get('demo') === '1'

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="secondary">Phase 1</Badge>
            <Badge className="gap-1.5" variant="outline">
              <Sparkles aria-hidden="true" className="size-3.5 text-primary" />
              Mock 센서
            </Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">오늘의 캠스터디</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            눈에 보이는 학습 조건을 차분하게 기록해 보세요.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Target aria-hidden="true" className="size-4" />
          오늘 목표 {formatMinutes(goalMinutes)}
        </div>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.75fr)]">
        <div className="min-w-0 space-y-6">
          <Card className="overflow-hidden border-primary/15 shadow-sm">
            <CardContent className="p-5 sm:p-8">
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      순공 시간
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            aria-label="순공 시간 정의"
                            className="size-11 rounded-full"
                            size="icon"
                            variant="ghost"
                          >
                            <Info aria-hidden="true" className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-72">
                          실제 집중력이 아니라 착석·자세·조도 조건을 충족한 시간입니다.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p
                      className="mt-3 font-mono text-5xl font-semibold tracking-[-0.06em] tabular-nums text-foreground sm:text-7xl"
                      data-testid="effective-time"
                    >
                      {formatDuration(durations.effectiveStudyMs)}
                    </p>
                  </div>
                  <div
                    aria-atomic="true"
                    aria-live="polite"
                    className={cn(
                      'flex max-w-sm items-start gap-3 rounded-2xl border px-4 py-3',
                      statusContent.className,
                    )}
                    data-testid="study-status"
                    role="status"
                  >
                    <StatusIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">{statusContent.label}</p>
                      <p className="mt-0.5 text-xs leading-relaxed opacity-80">{statusContent.description}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>목표 진행률</span>
                    <span className="font-medium text-foreground">{Math.round(goalProgress)}%</span>
                  </div>
                  <Progress aria-label={`목표 진행률 ${Math.round(goalProgress)}%`} value={goalProgress} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground" htmlFor="subject-select">
                      과목
                    </label>
                    <Select onValueChange={setSubject} value={subject}>
                      <SelectTrigger className="w-full" id="subject-select">
                        <SelectValue placeholder="과목 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECTS.map((item) => (
                          <SelectItem key={item} value={item}>{item}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground" htmlFor="goal-select">
                      목표 시간
                    </label>
                    <Select onValueChange={(value) => setGoalMinutes(Number(value))} value={String(goalMinutes)}>
                      <SelectTrigger className="w-full" id="goal-select">
                        <SelectValue placeholder="목표 시간 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {GOALS.map((minutes) => (
                          <SelectItem key={minutes} value={String(minutes)}>{formatMinutes(minutes)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  {isRunning ? (
                    <Button className="min-h-11 flex-1 gap-2" onClick={pauseSession} size="lg" variant="secondary">
                      <CirclePause aria-hidden="true" className="size-5" />
                      일시정지
                    </Button>
                  ) : (
                    <Button className="min-h-11 flex-1 gap-2" onClick={startSession} size="lg">
                      <CirclePlay aria-hidden="true" className="size-5" />
                      {lifecycle === 'PAUSED' ? '계속하기' : isFinished ? '새 세션 시작' : '세션 시작'}
                    </Button>
                  )}
                  <Button
                    className="min-h-11 gap-2"
                    disabled={!canFinish}
                    onClick={finishSession}
                    size="lg"
                    variant="outline"
                  >
                    <Square aria-hidden="true" className="size-4" />
                    종료
                  </Button>
                  <Button
                    aria-label="세션 초기화"
                    className="size-11 shrink-0"
                    disabled={lifecycle === 'IDLE' && durations.totalSessionMs === 0}
                    onClick={resetSession}
                    size="icon"
                    variant="ghost"
                  >
                    <RotateCcw aria-hidden="true" className="size-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {(timerVisibility.showTotalSessionTime ||
            timerVisibility.showPostureCautionTime ||
            timerVisibility.showAwayTime ||
            timerVisibility.showLuxCautionTime) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">상세 시간</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {timerVisibility.showTotalSessionTime && <TimerDetail label="전체 세션" value={durations.totalSessionMs} />}
                {timerVisibility.showPostureCautionTime && <TimerDetail label="자세 주의" value={durations.postureCautionMs} />}
                {timerVisibility.showAwayTime && <TimerDetail label="자리 비움" value={durations.awayMs} />}
                {timerVisibility.showLuxCautionTime && <TimerDetail label="조도 주의" value={durations.luxCautionMs} />}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">카메라 미리보기</CardTitle>
                <Badge variant="outline">Phase 2 예정</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative grid aspect-video min-h-64 place-items-center overflow-hidden rounded-2xl border bg-slate-950 text-white">
                <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_center,rgba(129,140,248,.7)_0,transparent_55%)]" />
                <div className="relative flex max-w-sm flex-col items-center px-6 text-center">
                  <span className="grid size-16 place-items-center rounded-2xl border border-white/15 bg-white/10">
                    <ScanFace aria-hidden="true" className="size-8 text-indigo-200" />
                  </span>
                  <p className="mt-4 font-medium">카메라 없이 Mock 모드로 실행 중</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-300">
                    이번 Phase에서는 영상이나 이미지를 요청·저장·전송하지 않습니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="min-w-0 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">현재 상태</CardTitle>
                <Badge variant="secondary">가상 분류</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={cn('flex items-center gap-3 rounded-xl border p-4', statusContent.className)}>
                <StatusIcon aria-hidden="true" className="size-6" />
                <div>
                  <p className="font-semibold">{statusContent.label}</p>
                  <p className="text-xs opacity-80">Mock {posture}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2" aria-label="Mock 자세 선택" role="group">
                {(['GOOD', 'BAD', 'AWAY'] as const).map((value) => (
                  <Button
                    aria-pressed={posture === value}
                    className={cn(
                      'min-h-11 px-2',
                      posture === value && value === 'GOOD' && 'bg-emerald-600 hover:bg-emerald-600',
                      posture === value && value === 'BAD' && 'bg-amber-600 hover:bg-amber-600',
                      posture === value && value === 'AWAY' && 'bg-slate-600 hover:bg-slate-600',
                    )}
                    key={value}
                    onClick={() => setPosture(value)}
                    variant={posture === value ? 'default' : 'outline'}
                  >
                    {value}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">현재 조도</CardTitle>
                <Badge
                  className={cn(
                    luxStatus === 'RECOMMENDED' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
                    luxStatus !== 'RECOMMENDED' && 'border-amber-200 bg-amber-50 text-amber-800',
                  )}
                  variant="outline"
                >
                  {LUX_LABELS[luxStatus]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="flex items-end justify-between">
                  <p className="font-mono text-4xl font-semibold tabular-nums">
                    {lux} <span className="text-base font-medium text-muted-foreground">Lux</span>
                  </p>
                  <Lightbulb aria-hidden="true" className={cn('size-7', luxStatus === 'RECOMMENDED' ? 'text-emerald-500' : 'text-amber-500')} />
                </div>
                <Progress
                  aria-label="가상 조도 범위"
                  aria-valuetext={`${lux} Lux, ${LUX_LABELS[luxStatus]}`}
                  className="mt-4"
                  value={(lux / 1_500) * 100}
                />
              </div>
              <div className="space-y-3">
                <Slider
                  aria-label={`현재 가상 조도 ${lux} Lux`}
                  max={1_500}
                  min={0}
                  onValueChange={([value]) => setLux(value)}
                  step={10}
                  value={[lux]}
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>0 Lux</span>
                  <span>권장 500~700</span>
                  <span>1500 Lux</span>
                </div>
              </div>

              {luxStatus === 'DARK' || luxStatus === 'DIM' ? (
                <Alert className="border-amber-200 bg-amber-50 text-amber-900">
                  <SunMedium aria-hidden="true" />
                  <AlertTitle>주변이 너무 어둡습니다.</AlertTitle>
                  <AlertDescription>스탠드를 켜 학습 공간의 밝기를 조절해 주세요.</AlertDescription>
                </Alert>
              ) : null}
              {luxStatus === 'TOO_BRIGHT' ? (
                <Alert className="border-orange-200 bg-orange-50 text-orange-900">
                  <TriangleAlert aria-hidden="true" />
                  <AlertTitle>주변이 지나치게 밝습니다.</AlertTitle>
                  <AlertDescription>화면이나 책상에 강한 반사가 없는지 확인해 주세요.</AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Accordion collapsible defaultValue={demoExpanded ? 'demo-controls' : undefined} type="single">
                <AccordionItem className="border-0" value="demo-controls">
                  <AccordionTrigger className="px-5 py-4 hover:no-underline">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <Sparkles aria-hidden="true" className="size-4 text-primary" />
                      데모 센서 제어
                      <Badge variant="secondary">가상 센서</Badge>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-5">
                    <div className="grid gap-2">
                      {[
                        { label: '어두운 환경', value: 200 },
                        { label: '적정 환경', value: 620 },
                        { label: '밝은 환경', value: 1200 },
                      ].map((preset) => (
                        <Button
                          className="min-h-11 justify-between"
                          key={preset.value}
                          onClick={() => setLux(preset.value)}
                          variant={lux === preset.value ? 'secondary' : 'outline'}
                        >
                          <span>{preset.label}</span>
                          <span className="font-mono text-xs tabular-nums">{preset.value} Lux</span>
                        </Button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card className="bg-primary/[0.04]">
            <CardContent className="p-5">
              <div className="flex gap-3">
                <Clock3 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold">순공 시간 안내</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    studylog의 순공 시간은 실제 집중력을 측정한 값이 아니라, 착석·자세
                    {countLuxInEffectiveTime ? '·조도' : ''} 조건을 충족한 시간입니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
