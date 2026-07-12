import { CameraOff, RefreshCw } from 'lucide-react'

import type { CameraErrorInfo } from '@/camera/camera-types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface CameraErrorStateProps {
  error: CameraErrorInfo
  onContinueDemo: () => void
  onRetry: () => void
}

export function CameraErrorState({ error, onContinueDemo, onRetry }: CameraErrorStateProps) {
  return (
    <Alert className="border-amber-200 bg-amber-50 text-amber-950">
      <CameraOff aria-hidden="true" />
      <AlertTitle>{error.title}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{error.message}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          {error.recoverable ? (
            <Button className="min-h-11 gap-2" onClick={onRetry} size="sm">
              <RefreshCw aria-hidden="true" className="size-4" />
              다시 시도
            </Button>
          ) : null}
          <Button className="min-h-11" onClick={onContinueDemo} size="sm" variant="outline">
            카메라 없이 데모 계속하기
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
