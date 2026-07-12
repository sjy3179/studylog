import { TM_POSE_LABEL_TEXT } from '@/ai/tm-pose/tm-pose-config'
import type { TmPosePredictionResult } from '@/ai/tm-pose/tm-pose-types'
import { cn } from '@/lib/utils'
import { TM_POSE_LABELS } from '@/types/study'

const BAR_COLOR = {
  GOOD_POSTURE: 'bg-emerald-500',
  FORWARD_LEAN: 'bg-amber-500',
  SIDE_LEAN: 'bg-orange-500',
  RESTING: 'bg-rose-500',
} as const

export function TmPoseProbabilityBars({
  prediction,
}: {
  prediction: TmPosePredictionResult
}) {
  return (
    <div className="space-y-3" aria-label="TM Pose 클래스별 원시 확률">
      {TM_POSE_LABELS.map((label) => {
        const percentage = prediction.probabilities[label] * 100
        return (
          <div className="space-y-1.5" key={label}>
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-medium text-slate-700" title={label}>
                {TM_POSE_LABEL_TEXT[label]}
              </span>
              <span className="font-mono tabular-nums text-slate-600">
                {percentage.toFixed(1)}%
              </span>
            </div>
            <div
              aria-label={`${TM_POSE_LABEL_TEXT[label]} ${percentage.toFixed(1)}%`}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={percentage}
              className="h-2 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
            >
              <div
                className={cn('h-full rounded-full transition-[width] duration-200', BAR_COLOR[label])}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
