import { Bug, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { TmPoseRuntimeSnapshot } from '@/ai/tm-pose/tm-pose-types'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Switch } from '@/components/ui/switch'

export function TmPoseDebugPanel({
  inputCanvas,
  snapshot,
}: {
  inputCanvas: HTMLCanvasElement | null
  snapshot: TmPoseRuntimeSnapshot
}) {
  const [open, setOpen] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const previewRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const preview = previewRef.current
    if (!showPreview || !preview || !inputCanvas || inputCanvas.width === 0) return
    preview.width = inputCanvas.width
    preview.height = inputCanvas.height
    preview.getContext('2d')?.drawImage(inputCanvas, 0, 0)
  }, [inputCanvas, showPreview, snapshot.prediction?.timestampMs])

  return (
    <Collapsible onOpenChange={setOpen} open={open}>
      <CollapsibleTrigger className="flex min-h-11 w-full items-center justify-between rounded-xl border px-4 text-sm font-medium">
        <span className="flex items-center gap-2"><Bug aria-hidden="true" className="size-4" />TM Pose 디버그</span>
        <ChevronDown aria-hidden="true" className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 space-y-4 rounded-xl border bg-slate-50 p-4 text-xs">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
          <dt className="text-muted-foreground">상태</dt><dd>{snapshot.status}</dd>
          <dt className="text-muted-foreground">runtime</dt><dd>{snapshot.modelInfo?.runtimeStrategy ?? '-'}</dd>
          <dt className="text-muted-foreground">TF.js</dt><dd>{snapshot.modelInfo?.tfjsVersion ?? '-'}</dd>
          <dt className="text-muted-foreground">TM Pose</dt><dd>{snapshot.modelInfo?.tmPoseVersion ?? '-'}</dd>
          <dt className="text-muted-foreground">모델</dt><dd>{snapshot.modelInfo?.modelName ?? '-'}</dd>
          <dt className="text-muted-foreground">입력</dt><dd>{snapshot.modelInfo?.inputResolution ?? '-'} px</dd>
          <dt className="text-muted-foreground">pose score</dt><dd>{snapshot.prediction?.poseScore?.toFixed(3) ?? '-'}</dd>
          <dt className="text-muted-foreground">최근 추론</dt><dd>{snapshot.prediction?.inferenceMs.toFixed(1) ?? '-'} ms</dd>
          <dt className="text-muted-foreground">평균 추론</dt><dd>{snapshot.averageInferenceMs.toFixed(1)} ms</dd>
          <dt className="text-muted-foreground">주기</dt><dd>{snapshot.currentIntervalMs} ms · {snapshot.estimatedHz.toFixed(1)} Hz</dd>
          <dt className="text-muted-foreground">오류 코드</dt><dd>{snapshot.error?.code ?? '-'}</dd>
          <dt className="text-muted-foreground">오류 메시지</dt><dd className="break-all">{snapshot.error?.message ?? '-'}</dd>
          <dt className="text-muted-foreground">asset URL</dt><dd className="break-all">{snapshot.error?.assetUrl ?? '-'}</dd>
          <dt className="text-muted-foreground">stack</dt><dd className="max-h-28 overflow-auto whitespace-pre-wrap break-all">{snapshot.error?.stack ?? '-'}</dd>
        </dl>
        <label className="flex min-h-11 items-center justify-between gap-3">
          <span>TM 입력 미리보기</span>
          <Switch checked={showPreview} onCheckedChange={setShowPreview} />
        </label>
        {showPreview ? (
          <canvas
            aria-label="TM Pose 중앙 정사각형 추론 입력"
            className="mx-auto aspect-square w-full max-w-64 rounded-xl border bg-slate-950 object-contain"
            ref={previewRef}
          />
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  )
}
