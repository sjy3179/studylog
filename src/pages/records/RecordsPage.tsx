import type { ReactNode } from 'react'
import {
  CalendarDays,
  Clock3,
  FileClock,
  ScanLine,
  SunMedium,
  Target,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type MetricCardProps = {
  icon: ReactNode
  label: string
  value: string
}

function MetricCard({ icon, label, value }: MetricCardProps) {
  return (
    <Card className="gap-0 border-0 bg-card py-0 shadow-sm ring-1 ring-border">
      <CardContent className="flex items-center justify-between gap-4 p-5 sm:block sm:p-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
          {icon}
        </span>
        <div className="text-right sm:mt-7 sm:text-left">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 font-mono text-2xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyRecords({ scope }: { scope: string }) {
  return (
    <Card className="gap-0 border-dashed bg-card py-0 shadow-none">
      <CardContent className="flex min-h-80 flex-col items-center justify-center px-6 py-14 text-center sm:min-h-96">
        <span className="relative flex size-16 items-center justify-center rounded-2xl bg-secondary text-primary">
          <FileClock aria-hidden="true" className="size-7" />
          <span className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full border-2 border-card bg-card text-muted-foreground">
            <CalendarDays aria-hidden="true" className="size-3.5" />
          </span>
        </span>
        <h3 className="mt-6 text-lg font-semibold tracking-tight text-foreground">
          아직 {scope} 기록이 없습니다
        </h3>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          학습 세션을 종료하면 순공 시간과 자세·조도 조건 기록이 이곳에 표시됩니다.
        </p>
      </CardContent>
    </Card>
  )
}

export function RecordsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">Records</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          학습 기록
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
          세션이 쌓이면 순공 시간과 목표 달성률, 자세·조도 조건을 기간별로 확인할 수 있습니다.
        </p>
      </header>

      <section className="mt-8" aria-labelledby="records-summary-title">
        <h2 className="sr-only" id="records-summary-title">
          기록 요약
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<Clock3 aria-hidden="true" className="size-5" />}
            label="순공 시간"
            value="00:00:00"
          />
          <MetricCard
            icon={<Target aria-hidden="true" className="size-5" />}
            label="목표 달성률"
            value="0%"
          />
          <MetricCard
            icon={<SunMedium aria-hidden="true" className="size-5" />}
            label="적정 조도 유지율"
            value="0%"
          />
          <MetricCard
            icon={<ScanLine aria-hidden="true" className="size-5" />}
            label="기준 자세 유지율"
            value="0%"
          />
        </div>
      </section>

      <section className="mt-8" aria-labelledby="records-list-title">
        <Card className="gap-0 border-0 bg-card py-0 shadow-sm ring-1 ring-border">
          <CardHeader className="gap-1 border-b px-5 py-5 sm:px-6">
            <CardTitle id="records-list-title" className="text-base font-semibold">
              기간별 기록
            </CardTitle>
            <CardDescription>기록을 일간, 주간, 과목별로 나누어 확인합니다.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <Tabs defaultValue="daily">
              <TabsList className="grid h-11! w-full grid-cols-3 p-1 sm:w-fit sm:min-w-80" aria-label="기록 범위">
                <TabsTrigger className="min-h-9 px-3" value="daily">
                  일간
                </TabsTrigger>
                <TabsTrigger className="min-h-9 px-3" value="weekly">
                  주간
                </TabsTrigger>
                <TabsTrigger className="min-h-9 px-3" value="subject">
                  과목별
                </TabsTrigger>
              </TabsList>
              <TabsContent className="mt-5" value="daily">
                <EmptyRecords scope="일간" />
              </TabsContent>
              <TabsContent className="mt-5" value="weekly">
                <EmptyRecords scope="주간" />
              </TabsContent>
              <TabsContent className="mt-5" value="subject">
                <EmptyRecords scope="과목별" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
