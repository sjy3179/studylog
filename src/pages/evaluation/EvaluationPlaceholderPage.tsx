import { ArrowLeft, BarChart3, LockKeyhole, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'

export function EvaluationPlaceholderPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-slate-50 px-5 py-12 sm:px-8">
      <Card
        className="w-full max-w-2xl gap-0 overflow-hidden border-0 bg-white py-0 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.45)] ring-1 ring-slate-200"
        aria-labelledby="evaluation-placeholder-title"
      >
        <CardHeader className="gap-5 border-b border-slate-100 px-6 py-7 sm:px-9 sm:py-9">
          <div className="flex items-start justify-between gap-4">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
              <BarChart3 aria-hidden="true" className="size-6" />
            </span>
            <Badge
              variant="outline"
              className="border-indigo-100 bg-indigo-50 text-indigo-700"
            >
              Phase 3 예정
            </Badge>
          </div>

          <div className="space-y-3">
            <h1
              id="evaluation-placeholder-title"
              className="text-2xl leading-tight font-semibold tracking-[-0.035em] text-slate-950 sm:text-3xl"
            >
              AI 모델 평가 도구를 준비하고 있어요
            </h1>
            <CardDescription className="max-w-xl text-[15px] leading-7 text-slate-600">
              Teachable Machine Pose 모델의 예측 결과와 실제 자세 라벨을 비교하는 평가
              화면은 Phase 3에서 제공합니다.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-6 py-7 sm:px-9 sm:py-9">
          <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200/80 sm:p-6">
            <div className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200">
                <LockKeyhole aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">현재 모델 로드 없음</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Phase 1에서는 제공된 모델 파일을 정적 자산으로만 보존합니다. 이 화면에서
                  카메라 권한 요청, 모델 다운로드 또는 AI 추론은 발생하지 않습니다.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button asChild variant="outline" className="h-11 rounded-xl">
              <Link to="/">
                <ArrowLeft aria-hidden="true" />
                홈으로 돌아가기
              </Link>
            </Button>
            <p className="flex items-center gap-2 text-xs text-slate-500">
              <Sparkles aria-hidden="true" className="size-4 text-indigo-500" />
              Phase 1 Mock 앱은 지금 사용할 수 있습니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
