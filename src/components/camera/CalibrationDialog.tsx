import type { CalibrationUiState } from '@/hooks/usePoseRuntime'
import { CalibrationProgress } from '@/components/camera/CalibrationProgress'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CalibrationDialogProps {
  onCancel: () => void
  onRetry: () => void
  state: CalibrationUiState
}

export function CalibrationDialog({ onCancel, onRetry, state }: CalibrationDialogProps) {
  const open = ['COUNTDOWN', 'COLLECTING', 'PROCESSING', 'FAILED'].includes(state.status)
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onCancel() }}>
      <DialogContent showCloseButton={state.status !== 'PROCESSING'}>
        <DialogHeader>
          <DialogTitle>기준 자세 등록</DialogTitle>
          <DialogDescription>
            평소 공부할 때의 편안하고 안정적인 자세를 취해 주세요. 의료적인 자세 진단이 아니라 현재 자세와 등록한 기준 자세를 비교하기 위한 기능입니다.
          </DialogDescription>
        </DialogHeader>
        <CalibrationProgress state={state} />
        <DialogFooter>
          {state.status === 'FAILED' ? (
            <Button className="min-h-11" onClick={onRetry}>다시 등록</Button>
          ) : null}
          {state.status !== 'PROCESSING' ? (
            <Button className="min-h-11" onClick={onCancel} variant="outline">취소</Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
