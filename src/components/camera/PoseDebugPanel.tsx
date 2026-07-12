import { ChevronDown, Gauge } from 'lucide-react'

import type { PoseRuntimeSnapshot } from '@/ai/pose-types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface PoseDebugPanelProps {
  snapshot: PoseRuntimeSnapshot
}

const REASON_LABELS = {
  FACE_MOVED_CLOSER: '얼굴 크기 증가',
  HEAD_DROPPED: '머리 세로 위치 변화',
  SHOULDER_TILTED: '어깨 기울기 변화',
  BODY_SHIFTED: '몸 중심 좌우 이동',
} as const

export function PoseDebugPanel({ snapshot }: PoseDebugPanelProps) {
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button className="min-h-11 w-full justify-between" variant="ghost">
          <span className="flex items-center gap-2"><Gauge aria-hidden="true" className="size-4" />자세 분석 정보</span>
          <ChevronDown aria-hidden="true" className="size-4" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 border-t px-4 py-4">
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <div><p className="text-muted-foreground">Engine</p><p className="mt-1 font-mono">{snapshot.engineStatus}</p></div>
          <div><p className="text-muted-foreground">추론 속도</p><p className="mt-1 font-mono">{snapshot.inferenceHz.toFixed(1)} Hz</p></div>
          <div><p className="text-muted-foreground">평균 추론</p><p className="mt-1 font-mono">{snapshot.averageInferenceMs.toFixed(1)} ms</p></div>
          <div><p className="text-muted-foreground">유효 관절</p><p className="mt-1 font-mono">{snapshot.latestFrame?.validLandmarkCount ?? 0}/33</p></div>
        </div>
        {snapshot.deviation ? (
          <div className="rounded-xl border bg-muted/25 p-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">기준 자세 상대 편차</span>
              <Badge variant="outline">{snapshot.deviation.level} · {(snapshot.deviation.score * 100).toFixed(0)}%</Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {snapshot.deviation.reasons.length > 0
                ? snapshot.deviation.reasons.map((reason) => <Badge key={reason} variant="secondary">{REASON_LABELS[reason]}</Badge>)
                : <span className="text-muted-foreground">큰 상대 편차 없음</span>}
            </div>
            <p className="mt-2 leading-relaxed text-muted-foreground">정보 표시용 프로토타입 수치이며 Mock 자세 상태와 타이머를 제어하지 않습니다.</p>
          </div>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  )
}
