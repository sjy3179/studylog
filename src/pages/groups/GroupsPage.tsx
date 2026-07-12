import type { ReactNode } from 'react'
import {
  BookOpen,
  Clock3,
  Coffee,
  Copy,
  LogIn,
  Plus,
  Settings2,
  Ticket,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DEMO_GROUP } from '@/groups/demo-group-data'
import { cn } from '@/lib/utils'

type GroupStatus = (typeof DEMO_GROUP.members)[number]['status']

const statusDetails: Record<
  GroupStatus,
  { dotClassName: string; label: string; textClassName: string }
> = {
  STUDYING: {
    dotClassName: 'bg-emerald-500',
    label: '공부 중',
    textClassName: 'text-emerald-700',
  },
  BREAK: {
    dotClassName: 'bg-amber-400',
    label: '휴식',
    textClassName: 'text-amber-700',
  },
  OFFLINE: {
    dotClassName: 'bg-slate-400',
    label: '오프라인',
    textClassName: 'text-muted-foreground',
  },
}

const weeklyRanking = [...DEMO_GROUP.members].sort(
  (first, second) => second.effectiveStudyMinutes - first.effectiveStudyMinutes,
)

function formatMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) {
    return `${minutes}분`
  }

  return `${hours}시간 ${minutes}분`
}

type UnavailableButtonProps = {
  fullWidth?: boolean
  icon: ReactNode
  label: string
  prominent?: boolean
}

function UnavailableButton({
  fullWidth = false,
  icon,
  label,
  prominent = false,
}: UnavailableButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          aria-disabled="true"
          aria-label={`${label}: 추후 지원 예정`}
          className={cn('inline-flex rounded-xl', fullWidth && 'w-full')}
          role="group"
          tabIndex={0}
        >
          <Button
            className={cn('min-h-11 rounded-xl', fullWidth && 'w-full')}
            disabled
            variant={prominent ? 'default' : 'outline'}
          >
            {icon}
            {label}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent sideOffset={8}>추후 지원 예정</TooltipContent>
    </Tooltip>
  )
}

function StatusBadge({ status }: { status: GroupStatus }) {
  const details = statusDetails[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium',
        details.textClassName,
      )}
    >
      <span aria-hidden="true" className={cn('size-2 rounded-full', details.dotClassName)} />
      {details.label}
    </span>
  )
}

export function GroupsPage() {
  return (
    <TooltipProvider>
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">Groups</p>
              <Badge className="border border-primary/15 bg-secondary text-secondary-foreground" variant="secondary">
                UI 데모
              </Badge>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              그룹
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              정적 데이터로 함께 공부하는 화면의 정보 구조를 미리 확인합니다.
            </p>
          </div>
          <UnavailableButton
            icon={<Settings2 aria-hidden="true" className="size-4" />}
            label="그룹 설정"
          />
        </header>

        <section className="mt-8" aria-labelledby="demo-group-title">
          <Card className="gap-0 border-0 bg-card py-0 shadow-sm ring-1 ring-border">
            <CardHeader className="gap-1 border-b px-5 py-5 sm:px-6 sm:py-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <CardTitle id="demo-group-title" className="text-lg font-semibold sm:text-xl">
                    {DEMO_GROUP.name}
                  </CardTitle>
                  <CardDescription className="mt-1.5 leading-6">
                    {DEMO_GROUP.description}
                  </CardDescription>
                </div>
                <Badge className="gap-1.5 self-start bg-primary/10 text-primary" variant="secondary">
                  <Users aria-hidden="true" className="size-3.5" />
                  {DEMO_GROUP.members.length}명
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-5 sm:p-6">
              <div className="grid gap-4 lg:grid-cols-[0.65fr_1.35fr]">
                <div className="flex min-h-48 flex-col justify-between rounded-2xl bg-primary p-6 text-primary-foreground shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-white/12">
                      <Clock3 aria-hidden="true" className="size-5" />
                    </span>
                    <span className="text-xs font-medium text-primary-foreground/70">오늘</span>
                  </div>
                  <div className="mt-10">
                    <p className="text-sm text-primary-foreground/75">그룹 총 순공 시간</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                      {formatMinutes(DEMO_GROUP.todayTotalMinutes)}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border bg-muted/35 p-5 sm:p-6">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <h2 className="text-base font-semibold text-foreground">그룹 액션</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Phase 1에서는 화면만 제공하며 실제 동작은 하지 않습니다.
                      </p>
                    </div>
                    <Badge variant="outline">추후 지원 예정</Badge>
                  </div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <UnavailableButton
                      fullWidth
                      icon={<Plus aria-hidden="true" className="size-4" />}
                      label="방 만들기"
                      prominent
                    />
                    <UnavailableButton
                      fullWidth
                      icon={<UserPlus aria-hidden="true" className="size-4" />}
                      label="초대하기"
                    />
                    <UnavailableButton
                      fullWidth
                      icon={<Ticket aria-hidden="true" className="size-4" />}
                      label="초대 코드 입력"
                    />
                    <UnavailableButton
                      fullWidth
                      icon={<LogIn aria-hidden="true" className="size-4" />}
                      label="참가하기"
                    />
                    <UnavailableButton
                      fullWidth
                      icon={<Copy aria-hidden="true" className="size-4" />}
                      label="초대 링크 복사"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="mt-6 grid items-start gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <section aria-labelledby="group-members-title">
            <Card className="gap-0 border-0 bg-card py-0 shadow-sm ring-1 ring-border">
              <CardHeader className="gap-1 border-b px-5 py-5 sm:px-6">
                <CardTitle id="group-members-title" className="text-base font-semibold">
                  멤버
                </CardTitle>
                <CardDescription>현재 상태와 과목, 목표 진행률을 확인합니다.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 p-5 md:grid-cols-2 sm:p-6 xl:grid-cols-1 2xl:grid-cols-2">
                {DEMO_GROUP.members.map((member) => (
                  <article className="rounded-2xl border bg-card p-5" key={member.id}>
                    <div className="flex items-start gap-4">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-sm font-semibold text-secondary-foreground">
                        {member.name.slice(0, 1)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-semibold text-foreground">{member.name}</h3>
                          <StatusBadge status={member.status} />
                        </div>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <BookOpen aria-hidden="true" className="size-3.5" />
                          {member.subject ?? '선택 과목 없음'}
                        </p>
                      </div>
                    </div>

                    <Separator className="my-5" />
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">오늘의 순공 시간</p>
                        <p className="mt-1 font-mono text-lg font-semibold text-foreground">
                          {formatMinutes(member.effectiveStudyMinutes)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-primary">{member.goalProgress}%</p>
                    </div>
                    <Progress
                      aria-label={`${member.name} 목표 달성률`}
                      aria-valuetext={`${member.goalProgress}%`}
                      className="mt-3 h-2 bg-secondary [&_[data-slot=progress-indicator]]:bg-primary"
                      value={member.goalProgress}
                    />
                  </article>
                ))}
              </CardContent>
            </Card>
          </section>

          <section aria-labelledby="weekly-ranking-title">
            <Card className="gap-0 border-0 bg-card py-0 shadow-sm ring-1 ring-border">
              <CardHeader className="gap-1 border-b px-5 py-5 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle id="weekly-ranking-title" className="text-base font-semibold">
                      주간 랭킹
                    </CardTitle>
                    <CardDescription className="mt-1">정적 UI 데모 순공 시간 기준</CardDescription>
                  </div>
                  <span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                    <Trophy aria-hidden="true" className="size-5" />
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4">
                <ol className="space-y-1">
                  {weeklyRanking.map((member, index) => (
                    <li
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-3',
                        member.id === 'me' ? 'bg-secondary' : 'bg-transparent',
                      )}
                      key={member.id}
                    >
                      <span
                        className={cn(
                          'flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold',
                          index === 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{member.name}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          {member.status === 'BREAK' && <Coffee aria-hidden="true" className="size-3" />}
                          {member.subject ?? '선택 과목 없음'}
                        </p>
                      </div>
                      <p className="whitespace-nowrap font-mono text-xs font-semibold text-foreground">
                        {formatMinutes(member.effectiveStudyMinutes)}
                      </p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </section>
        </div>

        <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
          이 페이지는 정적 UI 데모입니다. 그룹 데이터는 서버와 동기화되지 않습니다.
        </p>
      </div>
    </TooltipProvider>
  )
}
