import {
  Camera,
  CameraOff,
  ChevronDown,
  LoaderCircle,
  LockKeyhole,
  ScanLine,
  Square,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { PosePresenceStatus } from '@/ai/pose-types'
import { CameraControlBar } from '@/components/camera/CameraControlBar'
import { CameraErrorState } from '@/components/camera/CameraErrorState'
import { CalibrationDialog } from '@/components/camera/CalibrationDialog'
import { PoseDebugPanel } from '@/components/camera/PoseDebugPanel'
import { PoseOverlayCanvas } from '@/components/camera/PoseOverlayCanvas'
import { TmPosePredictionCard } from '@/components/camera/TmPosePredictionCard'
import { RuntimeDebugPanel } from '@/components/runtime/RuntimeDebugPanel'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCamera } from '@/hooks/useCamera'
import { usePoseRuntime } from '@/hooks/usePoseRuntime'
import { useTeachableMachinePose } from '@/hooks/useTeachableMachinePose'
import { useStudyRuntime } from '@/hooks/useStudyRuntime'
import { cn } from '@/lib/utils'
import { useStudySessionStore, useStudySettingsStore } from '@/stores/useStudyStore'

const PRESENCE_COPY: Record<PosePresenceStatus, { label: string; className: string }> = {
  UNKNOWN: { label: '사람 확인 전', className: 'border-slate-200 bg-slate-50 text-slate-700' },
  DETECTED: { label: '사람 감지됨', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  TEMPORARILY_MISSING: { label: '사람을 찾는 중', className: 'border-amber-200 bg-amber-50 text-amber-800' },
  MISSING: { label: '사람 미감지', className: 'border-slate-200 bg-slate-100 text-slate-700' },
}

const ENGINE_ERROR_COPY = {
  WASM_ASSET_ERROR: 'MediaPipe 실행 파일을 불러오지 못했습니다. /mediapipe/wasm 경로를 확인해 주세요.',
  MODEL_ASSET_ERROR: 'Pose Landmarker Lite 모델을 불러오지 못했습니다. 모델 정적 경로를 확인해 주세요.',
  INITIALIZATION_ERROR: '이 브라우저에서 자세 분석 엔진을 초기화하지 못했습니다.',
  INFERENCE_ERROR: '카메라 프레임을 분석하는 중 오류가 발생해 반복 추론을 중단했습니다.',
} as const

export function CameraPanel() {
  const [collapsedOnMobile, setCollapsedOnMobile] = useState(false)
  const {
    devices,
    error: cameraError,
    retry,
    selectedDeviceId,
    start,
    status: cameraStatus,
    stop,
    switchDevice,
    videoRef,
  } = useCamera()
  const mirrorCamera = useStudySettingsStore((state) => state.mirrorCamera)
  const setMirrorCamera = useStudySettingsStore((state) => state.setMirrorCamera)
  const showCameraPreview = useStudySettingsStore((state) => state.showCameraPreview)
  const setShowCameraPreview = useStudySettingsStore((state) => state.setShowCameraPreview)
  const showPoseOverlay = useStudySettingsStore((state) => state.showPoseOverlay)
  const setShowPoseOverlay = useStudySettingsStore((state) => state.setShowPoseOverlay)
  const setControlMode = useStudySessionStore((state) => state.setControlMode)
  const runtime = usePoseRuntime({
    cameraError,
    cameraStatus,
    selectedDeviceId,
    videoRef,
  })
  const tmRuntime = useTeachableMachinePose({
    cameraStatus,
    mirrorCamera,
    videoRef,
  })
  useStudyRuntime({
    cameraStatus,
    poseSnapshot: runtime.snapshot,
    tmSnapshot: tmRuntime.snapshot,
  })
  const isCameraReady = cameraStatus === 'READY'
  const isCameraBusy = ['REQUESTING_PERMISSION', 'STARTING', 'STOPPING'].includes(cameraStatus)
  const engineReady = ['READY', 'RUNNING', 'PAUSED'].includes(runtime.snapshot.engineStatus)
  const presenceCopy = PRESENCE_COPY[runtime.snapshot.presenceStatus]
  const profile = runtime.snapshot.calibration
  const deviceChanged = Boolean(
    profile?.cameraDeviceId &&
      selectedDeviceId &&
      profile.cameraDeviceId !== selectedDeviceId,
  )

  const continueDemo = () => {
    setControlMode('MOCK')
    tmRuntime.continueWithMock()
    stop()
    toast.info('카메라 없이 기존 Mock 자세 제어를 계속 사용할 수 있습니다.')
  }

  const startAi = async () => {
    setControlMode('AI')
    await start()
    if (!tmRuntime.snapshot.enabled) await tmRuntime.retry()
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">실시간 자세 분석</CardTitle>
            <Badge variant="secondary">Phase 4</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">카메라 {cameraStatus}</Badge>
            <Badge variant="outline">AI {runtime.snapshot.engineStatus}</Badge>
            {isCameraReady ? <Badge className={presenceCopy.className} variant="outline">{presenceCopy.label}</Badge> : null}
            <Button
              aria-expanded={!collapsedOnMobile}
              aria-label={collapsedOnMobile ? '카메라 카드 펼치기' : '카메라 카드 접기'}
              className="size-11 md:hidden"
              onClick={() => setCollapsedOnMobile((current) => !current)}
              size="icon"
              variant="ghost"
            >
              <ChevronDown aria-hidden="true" className={cn('size-4 transition-transform', !collapsedOnMobile && 'rotate-180')} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn('space-y-4', collapsedOnMobile && 'hidden md:block')}>
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border bg-slate-950">
          <video
            aria-label="실시간 카메라 미리보기"
            className={cn(
              'absolute inset-0 size-full object-contain transition-[transform,opacity] duration-200',
              mirrorCamera && '-scale-x-100',
              !showCameraPreview && 'opacity-0',
            )}
            muted
            playsInline
            ref={videoRef}
          />
          <PoseOverlayCanvas
            mirror={mirrorCamera}
            subscribeFrame={runtime.subscribeFrame}
            visible={showPoseOverlay}
          />

          {!isCameraReady ? (
            <div className="absolute inset-0 grid place-items-center bg-slate-950/92 p-5 text-center text-white">
              <div className="max-w-md">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-white/15 bg-white/10">
                  {isCameraBusy ? (
                    <LoaderCircle aria-hidden="true" className="size-7 animate-spin text-indigo-200" />
                  ) : (
                    <Camera aria-hidden="true" className="size-7 text-indigo-200" />
                  )}
                </span>
                <p className="mt-4 font-medium">
                  {isCameraBusy ? '카메라를 준비하고 있습니다' : '카메라를 켜고 자세 분석을 시작하세요'}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">
                  영상은 이 브라우저 안에서만 실시간 분석되며 저장하거나 서버로 보내지 않습니다.
                </p>
                {!isCameraBusy && cameraStatus !== 'ERROR' ? (
                  <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
                    <Button className="min-h-11 gap-2" onClick={() => void startAi()}>
                      <Camera aria-hidden="true" className="size-4" />카메라 켜기
                    </Button>
                    <Button className="min-h-11 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={continueDemo} variant="outline">
                      카메라 없이 데모 계속하기
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {isCameraReady && !showCameraPreview ? (
            <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-slate-900/75 px-3 py-1.5 text-xs text-white">미리보기 숨김</div>
          ) : null}
        </div>

        {cameraError ? (
          <CameraErrorState error={cameraError} onContinueDemo={continueDemo} onRetry={() => void retry()} />
        ) : null}

        {runtime.snapshot.engineError ? (
          <Alert className="border-amber-200 bg-amber-50 text-amber-950">
            <ScanLine aria-hidden="true" />
            <AlertTitle>자세 분석 모델을 시작하지 못했습니다.</AlertTitle>
            <AlertDescription>
              {ENGINE_ERROR_COPY[runtime.snapshot.engineError.code]} 카메라는 끄지 않아도 Mock 자세 제어를 계속 사용할 수 있습니다.
            </AlertDescription>
          </Alert>
        ) : null}

        {isCameraReady ? (
          <>
            <CameraControlBar
              devices={devices}
              mirrorCamera={mirrorCamera}
              onMirrorChange={setMirrorCamera}
              onOverlayChange={setShowPoseOverlay}
              onPreviewChange={setShowCameraPreview}
              onSwitchDevice={(deviceId) => void switchDevice(deviceId)}
              selectedDeviceId={selectedDeviceId}
              showOverlay={showPoseOverlay}
              showPreview={showCameraPreview}
            />

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                className="min-h-11 flex-1 gap-2"
                disabled={!engineReady}
                onClick={runtime.startCalibration}
                variant="secondary"
              >
                <ScanLine aria-hidden="true" className="size-4" />
                {profile ? '기준 자세 다시 등록' : '기준 자세 등록'}
              </Button>
              <Button className="min-h-11 gap-2" onClick={stop} variant="outline">
                <Square aria-hidden="true" className="size-4" />카메라 끄기
              </Button>
              {profile ? (
                <Button className="min-h-11" onClick={runtime.resetCalibration} variant="ghost">
                  기준 초기화
                </Button>
              ) : null}
            </div>

            {deviceChanged ? (
              <Alert>
                <CameraOff aria-hidden="true" />
                <AlertTitle>카메라 장치가 변경되었습니다.</AlertTitle>
                <AlertDescription>현재 장치에서 기준 자세를 다시 등록하는 것을 권장합니다.</AlertDescription>
              </Alert>
            ) : null}

            <PoseDebugPanel snapshot={runtime.snapshot} />
            <RuntimeDebugPanel />

          </>
        ) : null}

        <TmPosePredictionCard
          inputCanvas={tmRuntime.inputCanvas}
          onContinueMock={continueDemo}
          onPrepare={() => void tmRuntime.prepareModel()}
          onRetry={() => void tmRuntime.retry()}
          snapshot={tmRuntime.snapshot}
        />

        <div className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <LockKeyhole aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          원본 영상·이미지·관절 배열·TM 입력 frame은 저장하지 않습니다. AI 모드에서는 요약 신호만 융합·안정화해 타이머 조건에 사용합니다.
        </div>
      </CardContent>

      <CalibrationDialog
        onCancel={runtime.cancelCalibration}
        onRetry={runtime.startCalibration}
        state={runtime.calibrationUi}
      />
    </Card>
  )
}
