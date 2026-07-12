import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

import type { PoseRuntimeSnapshot } from '@/ai/pose-types'
import type { TmPoseRuntimeSnapshot } from '@/ai/tm-pose/tm-pose-types'
import type { CameraStatus } from '@/camera/camera-types'
import { RUNTIME_TICK_MS } from '@/runtime/runtime-config'
import { recordSignalReceipt, type SignalReceiptState } from '@/runtime/SignalReceiptClock'
import { StudyRuntimeController } from '@/runtime/StudyRuntimeController'
import type { MediaPipePostureSignal, TmPoseSignal } from '@/runtime/runtime-types'
import { useStudySessionStore, useStudySettingsStore } from '@/stores/useStudyStore'

interface UseStudyRuntimeOptions {
  cameraStatus: CameraStatus
  poseSnapshot: PoseRuntimeSnapshot
  tmSnapshot: TmPoseRuntimeSnapshot
}

export function useStudyRuntime(options: UseStudyRuntimeOptions): void {
  const optionsRef = useRef(options)
  const controllerRef = useRef(new StudyRuntimeController())
  const mediaPipeReceiptRef = useRef<SignalReceiptState>({ sourceTimestampMs: null, receivedAtMs: null })
  const sessionRevision = useStudySessionStore((state) => state.sessionRevision)
  const runtimeRevision = useStudySessionStore((state) => state.runtimeRevision)

  useEffect(() => {
    optionsRef.current = options
  }, [options])

  useEffect(() => {
    controllerRef.current.reset(performance.now())
  }, [runtimeRevision, sessionRevision])

  useEffect(() => {
    const run = () => {
      const nowMs = performance.now()
      const current = optionsRef.current
      const session = useStudySessionStore.getState()
      const settings = useStudySettingsStore.getState()
      mediaPipeReceiptRef.current = recordSignalReceipt(
        mediaPipeReceiptRef.current,
        current.poseSnapshot.latestFrame?.timestampMs ?? null,
        nowMs,
      )
      const result = controllerRef.current.tick({
        nowMs,
        mode: session.controlMode,
        lifecycle: session.lifecycle,
        rawLux: session.lux,
        countLuxInEffectiveTime: settings.countLuxInEffectiveTime,
        mockPosture: session.mockPosture,
        tmPrediction: toTmSignal(current.tmSnapshot),
        mediaPipeSignal: toMediaPipeSignal(
          current.poseSnapshot,
          mediaPipeReceiptRef.current.receivedAtMs,
        ),
        cameraReady: current.cameraStatus === 'READY',
        cameraError: current.cameraStatus === 'ERROR' || Boolean(current.poseSnapshot.error),
        mediaPipeReady: ['READY', 'RUNNING', 'PAUSED'].includes(current.poseSnapshot.engineStatus),
        mediaPipeError: current.poseSnapshot.engineStatus === 'ERROR',
        tmReady: ['READY', 'RUNNING', 'PAUSED'].includes(current.tmSnapshot.status),
        tmError: current.tmSnapshot.status === 'ERROR',
      })
      session.applyRuntimeSnapshot(result.snapshot)
      for (const event of result.alerts) toast.warning(event.title, { description: event.message })
    }

    run()
    const intervalId = window.setInterval(run, RUNTIME_TICK_MS)
    return () => {
      window.clearInterval(intervalId)
      const session = useStudySessionStore.getState()
      if (session.controlMode === 'AI') {
        useStudySessionStore.setState({ posture: 'UNKNOWN', runtimeSnapshot: null })
      }
    }
  }, [])
}

function toTmSignal(snapshot: TmPoseRuntimeSnapshot): TmPoseSignal | null {
  const prediction = snapshot.prediction
  if (!prediction) return null
  return {
    timestampMs: prediction.timestampMs,
    label: prediction.topLabel,
    confidence: prediction.confidence,
    probabilities: prediction.probabilities,
    inferenceMs: prediction.inferenceMs,
    modelVersion: prediction.modelVersion,
  }
}

function toMediaPipeSignal(
  snapshot: PoseRuntimeSnapshot,
  receivedAtMs: number | null,
): MediaPipePostureSignal | null {
  const frame = snapshot.latestFrame
  if (!frame || receivedAtMs === null) return null
  return {
    timestampMs: receivedAtMs,
    poseDetected: frame.detected,
    deviationScore: snapshot.deviation?.score ?? null,
    deviationReasons: snapshot.deviation?.reasons ?? [],
    inferenceMs: frame.inferenceMs,
    calibrationAvailable: Boolean(snapshot.calibration),
  }
}
