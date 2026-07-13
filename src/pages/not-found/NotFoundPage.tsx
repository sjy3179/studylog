import { ArrowRight, Home, Search } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function NotFoundPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-slate-50 px-5 py-12 sm:px-8">
      <Card
        className="w-full max-w-xl gap-0 border-0 bg-white py-0 text-center shadow-[0_24px_70px_-42px_rgba(15,23,42,0.45)] ring-1 ring-slate-200"
        aria-labelledby="not-found-title"
      >
        <CardContent className="px-6 py-10 sm:px-10 sm:py-14">
          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
            오류 404
          </Badge>

          <span className="mx-auto mt-7 flex size-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
            <Search aria-hidden="true" className="size-7" />
          </span>

          <h1
            id="not-found-title"
            className="mt-7 text-3xl leading-tight font-semibold tracking-[-0.04em] text-slate-950"
          >
            페이지를 찾을 수 없어요
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-7 text-slate-600">
            주소가 바뀌었거나 존재하지 않는 경로입니다. studylog 홈으로 돌아가거나 오늘의
            Mock 학습 세션을 시작해 보세요.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild variant="outline" className="h-11 rounded-xl">
              <Link to="/">
                <Home aria-hidden="true" />
                홈으로
              </Link>
            </Button>
            <Button asChild className="h-11 rounded-xl">
              <Link to="/app">
                오늘 화면 열기
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
