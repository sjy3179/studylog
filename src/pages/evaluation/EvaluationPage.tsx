import { ArrowLeft, FlaskConical } from 'lucide-react'
import { Link } from 'react-router-dom'

import { CameraPanel } from '@/components/camera/CameraPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function EvaluationPage() {
  return (
    <main className="min-h-svh bg-slate-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FlaskConical aria-hidden="true" className="size-5 text-indigo-600" />
              <Badge variant="secondary">Phase 3 진단</Badge>
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">파일럿 자세 모델 확인</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              실제 자세별 원시 확률과 모델 상태를 확인합니다. 결과는 저장되지 않으며 타이머를 제어하지 않습니다.
            </p>
          </div>
          <Button asChild className="min-h-11" variant="outline">
            <Link to="/app"><ArrowLeft aria-hidden="true" className="size-4" />오늘 화면</Link>
          </Button>
        </header>
        <CameraPanel />
      </div>
    </main>
  )
}
