import { ArrowLeft, Clock3, FileText } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'

export function ReportPlaceholderPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const displayedSessionId = sessionId ?? '알 수 없음'

  return (
    <main className="flex min-h-svh items-center justify-center bg-slate-50 px-5 py-12 sm:px-8">
      <Card
        className="w-full max-w-2xl gap-0 overflow-hidden border-0 bg-white py-0 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.45)] ring-1 ring-slate-200"
        aria-labelledby="report-placeholder-title"
      >
        <CardHeader className="gap-5 border-b border-slate-100 px-6 py-7 sm:px-9 sm:py-9">
          <div className="flex items-start justify-between gap-4">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
              <FileText aria-hidden="true" className="size-6" />
            </span>
            <Badge
              variant="outline"
              className="border-indigo-100 bg-indigo-50 text-indigo-700"
            >
              Phase 5 예정
            </Badge>
          </div>

          <div className="space-y-3">
            <h1
              id="report-placeholder-title"
              className="text-2xl leading-tight font-semibold tracking-[-0.035em] text-slate-950 sm:text-3xl"
            >
              세션 리포트를 준비하고 있어요
            </h1>
            <CardDescription className="max-w-xl text-[15px] leading-7 text-slate-600">
              세션 영속화와 상태 타임라인, 자세·조도 통계를 포함한 상세 리포트는 Phase
              5에서 제공합니다.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-6 py-7 sm:px-9 sm:py-9">
          <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200/80 sm:p-6">
            <div className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200">
                <Clock3 aria-hidden="true" className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">요청한 세션 ID</p>
                <p className="mt-2 break-all font-mono text-sm text-slate-600">
                  {displayedSessionId}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Phase 1에서는 세션을 브라우저 저장소에 영속화하지 않으므로 아직 이 ID에
                  해당하는 리포트를 불러오지 않습니다.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline" className="h-11 rounded-xl">
              <Link to="/app">
                <ArrowLeft aria-hidden="true" />
                오늘 화면으로
              </Link>
            </Button>
            <Button asChild className="h-11 rounded-xl">
              <Link to="/app/records">기록 기본 UI 보기</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
