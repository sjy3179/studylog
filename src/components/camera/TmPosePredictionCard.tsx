import { BrainCircuit, LoaderCircle, RefreshCw, TriangleAlert } from 'lucide-react'

import { TM_POSE_LABEL_TEXT } from '@/ai/tm-pose/tm-pose-config'
import type { TmPoseRuntimeSnapshot } from '@/ai/tm-pose/tm-pose-types'
import { TmPoseDebugPanel } from '@/components/camera/TmPoseDebugPanel'
import { TmPoseProbabilityBars } from '@/components/camera/TmPoseProbabilityBars'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const LOADING_STATUSES = new Set([
  'LOADING_RUNTIME',
  'LOADING_METADATA',
  'LOADING_MODEL',
  'VALIDATING_MODEL',
])

export function TmPosePredictionCard({
  inputCanvas,
  onContinueMock,
  onPrepare,
  onRetry,
  snapshot,
}: {
  inputCanvas: HTMLCanvasElement | null
  onContinueMock: () => void
  onPrepare: () => void
  onRetry: () => void
  snapshot: TmPoseRuntimeSnapshot
}) {
  const prediction = snapshot.prediction
  const isLoading = LOADING_STATUSES.has(snapshot.status)

  return (
    <section className="space-y-4 rounded-2xl border bg-white p-4 sm:p-5" aria-label="TM Pose 원시 예측">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BrainCircuit className="size-5 text-indigo-600" aria-hidden="true" />
          <h3 className="text-sm font-semibold">AI 자세 모델</h3>
          <Badge variant="secondary">파일럿</Badge>
        </div>
        <Badge variant="outline">TM {snapshot.status}</Badge>
      </div>

      {isLoading ? (
        <div className="flex min-h-24 items-center justify-center gap-2 rounded-xl bg-slate-50 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          로컬 자세 모델을 준비하고 있습니다.
        </div>
      ) : null}

      {snapshot.status === 'IDLE' && snapshot.enabled ? (
        <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">카메라와 별개로 로컬 모델 파일을 먼저 확인할 수 있습니다.</p>
          <Button className="min-h-11 shrink-0" onClick={onPrepare} variant="outline">
            모델 파일 확인
          </Button>
        </div>
      ) : null}

      {snapshot.error ? (
        <Alert className="border-amber-200 bg-amber-50 text-amber-950">
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>자세 모델을 불러오지 못했습니다.</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>페이지를 다시 시도하거나 기존 Mock 데모로 계속할 수 있습니다.</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button className="min-h-11 gap-2" onClick={onRetry} size="sm" variant="outline">
                <RefreshCw className="size-4" />모델 다시 불러오기
              </Button>
              <Button className="min-h-11" onClick={onContinueMock} size="sm" variant="ghost">
                Mock 데모로 계속하기
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      {!snapshot.enabled ? (
        <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">TM 원시 예측을 멈췄습니다. 명시적으로 다시 시작할 수 있습니다.</p>
          <Button className="min-h-11" onClick={onRetry} variant="outline">AI 모델 다시 시작</Button>
        </div>
      ) : null}

      {prediction && snapshot.enabled ? (
        <>
          <div className="rounded-xl bg-indigo-50 p-4 ring-1 ring-indigo-100">
            <p className="text-xs font-medium text-indigo-700">현재 원시 예측</p>
            <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
              <p className="text-lg font-semibold text-slate-950">
                {prediction.topLabel ? TM_POSE_LABEL_TEXT[prediction.topLabel] : '자세 확인 중'}
              </p>
              <p className="font-mono text-sm tabular-nums text-indigo-800">
                신뢰도 {(prediction.confidence * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          <TmPoseProbabilityBars prediction={prediction} />
        </>
      ) : null}

      <p className="text-xs leading-relaxed text-muted-foreground">
        현재 결과는 상태 안정화 전의 원시 예측입니다. AI 모드에서는 MediaPipe와 융합한 뒤 다수결·지속시간을 통과한 결과만 타이머에 반영됩니다.
      </p>
      <TmPoseDebugPanel inputCanvas={inputCanvas} snapshot={snapshot} />
    </section>
  )
}
