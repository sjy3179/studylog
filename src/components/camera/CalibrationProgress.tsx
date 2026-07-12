import type { CalibrationUiState } from '@/hooks/usePoseRuntime'
import { Progress } from '@/components/ui/progress'

interface CalibrationProgressProps {
  state: CalibrationUiState
}

export function CalibrationProgress({ state }: CalibrationProgressProps) {
  const message =
    state.status === 'COUNTDOWN'
      ? `${state.countdownSeconds}`
      : state.status === 'COLLECTING'
        ? '기준 자세를 유지해 주세요'
        : state.status === 'PROCESSING'
          ? '기준값을 계산하고 있습니다'
          : state.status === 'FAILED'
            ? '등록에 실패했습니다'
            : '준비됨'

  return (
    <div aria-live="polite" className="space-y-4 text-center" role="status">
      <div className="grid min-h-28 place-items-center rounded-2xl bg-primary/[0.06]">
        <p className={state.status === 'COUNTDOWN' ? 'font-mono text-6xl font-semibold text-primary' : 'text-base font-semibold'}>
          {message}
        </p>
      </div>
      <Progress aria-label="기준 자세 등록 진행률" value={state.progress * 100} />
      <p className="text-xs text-muted-foreground">유효 샘플 {state.sampleCount}개 · 최소 12개</p>
      {state.errorMessage ? <p className="text-sm leading-relaxed text-destructive">{state.errorMessage}</p> : null}
    </div>
  )
}
