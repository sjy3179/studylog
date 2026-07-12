import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { toast } from 'sonner'

import { CalibrationManager } from '@/ai/CalibrationManager'
import { browserAiInferenceCoordinator } from '@/ai/BrowserAiInferenceCoordinator'
import { MediaPipePoseEngine } from '@/ai/MediaPipePoseEngine'
import { PoseFeatureExtractor } from '@/ai/PoseFeatureExtractor'
import { PostureDeviationAnalyzer } from '@/ai/PostureDeviationAnalyzer'
import { POSE_INFERENCE_INTERVAL_MS, POSE_VALIDATION_CONFIG } from '@/ai/pose-config'
import type {
  CalibrationStatus,
  PoseFrameResult,
  PosePresenceStatus,
  PoseRuntimeSnapshot,
} from '@/ai/pose-types'
import type { CameraErrorInfo, CameraStatus } from '@/camera/camera-types'
import { useCalibrationStore } from '@/stores/useStudyStore'

type FrameSubscriber = (frame: PoseFrameResult | null) => void

interface UsePoseRuntimeOptions {
  cameraError: CameraErrorInfo | null
  cameraStatus: CameraStatus
  selectedDeviceId: string | null
  videoRef: RefObject<HTMLVideoElement | null>
}

export interface CalibrationUiState {
  countdownSeconds: number
  errorMessage: string | null
  progress: number
  sampleCount: number
  status: CalibrationStatus
}

export interface UsePoseRuntimeResult {
  calibrationUi: CalibrationUiState
  cancelCalibration: () => void
  resetCalibration: () => void
  snapshot: PoseRuntimeSnapshot
  startCalibration: () => void
  subscribeFrame: (subscriber: FrameSubscriber) => () => void
}

function summarizeFrame(frame: PoseFrameResult | null): PoseFrameResult | null {
  return frame
    ? { ...frame, landmarks: [], worldLandmarks: null }
    : null
}

export function usePoseRuntime({
  cameraError,
  cameraStatus,
  selectedDeviceId,
  videoRef,
}: UsePoseRuntimeOptions): UsePoseRuntimeResult {
  const profile = useCalibrationStore((state) => state.profile)
  const clearProfile = useCalibrationStore((state) => state.clearProfile)
  const setProfile = useCalibrationStore((state) => state.setProfile)
  const profileRef = useRef(profile)
  const selectedDeviceRef = useRef(selectedDeviceId)
  const engineRef = useRef(new MediaPipePoseEngine())
  const calibrationRef = useRef(new CalibrationManager())
  const subscribersRef = useRef(new Set<FrameSubscriber>())
  const [calibrationUi, setCalibrationUi] = useState<CalibrationUiState>({
    countdownSeconds: 0,
    errorMessage: null,
    progress: 0,
    sampleCount: 0,
    status: profile ? 'CALIBRATED' : 'NOT_CALIBRATED',
  })
  const [snapshot, setSnapshot] = useState<PoseRuntimeSnapshot>({
    cameraStatus,
    engineStatus: 'IDLE',
    presenceStatus: 'UNKNOWN',
    latestFrame: null,
    features: null,
    calibration: profile,
    calibrationStatus: profile ? 'CALIBRATED' : 'NOT_CALIBRATED',
    deviation: null,
    inferenceHz: 0,
    averageInferenceMs: 0,
    error: cameraError,
    engineError: null,
  })

  useEffect(() => {
    profileRef.current = profile
  }, [profile])
  useEffect(() => {
    selectedDeviceRef.current = selectedDeviceId
  }, [selectedDeviceId])

  const subscribeFrame = useCallback((subscriber: FrameSubscriber) => {
    subscribersRef.current.add(subscriber)
    return () => subscribersRef.current.delete(subscriber)
  }, [])

  const publishCalibrationUi = useCallback((errorMessage?: string | null) => {
    const manager = calibrationRef.current
    setCalibrationUi((current) => ({
      countdownSeconds: manager.getCountdownSeconds(),
      errorMessage: errorMessage === undefined ? current.errorMessage : errorMessage,
      progress: manager.getProgress(),
      sampleCount: manager.getSampleCount(),
      status: manager.getStatus(),
    }))
  }, [])

  const startCalibration = useCallback(() => {
    if (cameraStatus !== 'READY' || !engineRef.current.isReady()) return
    calibrationRef.current.start()
    publishCalibrationUi(null)
  }, [cameraStatus, publishCalibrationUi])

  const cancelCalibration = useCallback(() => {
    calibrationRef.current.cancel()
    publishCalibrationUi()
  }, [publishCalibrationUi])

  const resetCalibration = useCallback(() => {
    clearProfile()
    calibrationRef.current.reset()
    if (cameraStatus === 'READY' && engineRef.current.isReady()) {
      calibrationRef.current.markReady(false)
    }
    publishCalibrationUi()
    toast.success('기준 자세를 초기화했습니다.')
  }, [cameraStatus, clearProfile, publishCalibrationUi])

  useEffect(() => {
    if (cameraStatus !== 'READY') {
      engineRef.current.pause()
      for (const subscriber of subscribersRef.current) subscriber(null)
      return
    }

    const engine = engineRef.current
    const extractor = new PoseFeatureExtractor()
    const analyzer = new PostureDeviationAnalyzer()
    const subscribers = subscribersRef.current
    let active = true
    let animationFrameId = 0
    let firstInferenceAt: number | null = null
    let inferenceInFlight = false
    let lastDetectedAt: number | null = null
    let lastCalibrationSampleAt = -Infinity
    let lastInferenceAt = 0
    let lastPublishedAt = 0
    let lastTimestamp = 0
    let lastVideoTime = -1
    let latestFrame: PoseFrameResult | null = null
    let latestPresence: PosePresenceStatus = 'UNKNOWN'
    let latestFeatures = null as ReturnType<PoseFeatureExtractor['extract']>
    let latestDeviation = null as ReturnType<PostureDeviationAnalyzer['analyze']> | null
    const inferenceDurations: number[] = []
    const inferenceTimestamps: number[] = []

    const publish = (now: number) => {
      const calibration = calibrationRef.current
      setSnapshot({
        cameraStatus: 'READY',
        engineStatus: engine.getStatus(),
        presenceStatus: latestPresence,
        latestFrame: summarizeFrame(latestFrame),
        features: latestFeatures,
        calibration: profileRef.current,
        calibrationStatus: calibration.getStatus(),
        deviation: latestDeviation,
        inferenceHz:
          inferenceTimestamps.length > 1
            ? ((inferenceTimestamps.length - 1) * 1_000) /
              (inferenceTimestamps.at(-1)! - inferenceTimestamps[0])
            : 0,
        averageInferenceMs:
          inferenceDurations.length > 0
            ? inferenceDurations.reduce((total, value) => total + value, 0) /
              inferenceDurations.length
            : 0,
        error: cameraError,
        engineError: engine.getError(),
      })
      publishCalibrationUi()
      lastPublishedAt = now
    }

    const updateCalibration = (now: number) => {
      const calibration = calibrationRef.current
      calibration.update(now)
      const frameIsFresh = Boolean(
        latestFrame?.detected &&
          latestFeatures &&
          now - latestFrame.timestampMs <= POSE_VALIDATION_CONFIG.temporarilyMissingMs,
      )
      if (
        calibration.getStatus() === 'COLLECTING' &&
        frameIsFresh &&
        now - lastCalibrationSampleAt >= POSE_INFERENCE_INTERVAL_MS
      ) {
        calibration.recordObservation(latestFeatures, now)
        lastCalibrationSampleAt = now
      }
      calibration.update(now)
      if (calibration.getStatus() !== 'PROCESSING') return
      try {
        const nextProfile = calibration.finish({
          cameraDeviceId: selectedDeviceRef.current,
        })
        profileRef.current = nextProfile
        setProfile(nextProfile)
        toast.success('기준 자세 등록을 완료했습니다.')
      } catch (error) {
        publishCalibrationUi(
          error instanceof Error ? error.message : '기준 자세 등록에 실패했습니다.',
        )
      }
    }

    const run = (now: number) => {
      if (!active) return
      animationFrameId = requestAnimationFrame(run)
      const video = videoRef.current
      if (document.hidden) {
        engine.pause()
        return
      }
      engine.resume()
      updateCalibration(now)
      if (
        !video ||
        video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        video.videoWidth === 0 ||
        video.videoHeight === 0 ||
        !engine.isReady() ||
        inferenceInFlight ||
        now - lastInferenceAt < POSE_INFERENCE_INTERVAL_MS ||
        video.currentTime === lastVideoTime
      ) {
        return
      }

      if (!browserAiInferenceCoordinator.tryAcquire('MEDIAPIPE')) return

      inferenceInFlight = true
      lastInferenceAt = now
      lastVideoTime = video.currentTime
      lastTimestamp = Math.max(now, lastTimestamp + 0.001)
      try {
        latestFrame = engine.detect(video, lastTimestamp)
        firstInferenceAt ??= now
        latestFeatures = extractor.extract(latestFrame)
        if (latestFrame.detected) {
          lastDetectedAt = now
          latestPresence = 'DETECTED'
        } else {
          const missingSince = lastDetectedAt ?? firstInferenceAt
          latestPresence =
            missingSince !== null && now - missingSince >= POSE_VALIDATION_CONFIG.temporarilyMissingMs
              ? 'MISSING'
              : 'TEMPORARILY_MISSING'
        }

        latestDeviation =
          latestFeatures && profileRef.current
            ? analyzer.analyze(latestFeatures, profileRef.current)
            : null
        inferenceDurations.push(latestFrame.inferenceMs)
        inferenceTimestamps.push(now)
        if (inferenceDurations.length > 30) inferenceDurations.shift()
        while (inferenceTimestamps.length > 1 && now - inferenceTimestamps[0] > 2_000) {
          inferenceTimestamps.shift()
        }
        for (const subscriber of subscribers) subscriber(latestFrame)
        if (now - lastPublishedAt >= 100) publish(now)
      } catch {
        publish(now)
        active = false
        cancelAnimationFrame(animationFrameId)
      } finally {
        inferenceInFlight = false
        browserAiInferenceCoordinator.release('MEDIAPIPE')
      }
    }

    void engine
      .initialize()
      .then(() => {
        if (!active) return
        calibrationRef.current.markReady(Boolean(profileRef.current))
        publishCalibrationUi()
        setSnapshot((current) => ({
          ...current,
          cameraStatus: 'READY',
          engineStatus: engine.getStatus(),
          calibrationStatus: calibrationRef.current.getStatus(),
        }))
        animationFrameId = requestAnimationFrame(run)
      })
      .catch(() => {
        if (!active) return
        setSnapshot((current) => ({
          ...current,
          engineStatus: engine.getStatus(),
          engineError: engine.getError(),
        }))
      })

    return () => {
      active = false
      cancelAnimationFrame(animationFrameId)
      engine.dispose()
      for (const subscriber of subscribers) subscriber(null)
    }
  }, [cameraError, cameraStatus, publishCalibrationUi, setProfile, videoRef])

  return {
    calibrationUi,
    cancelCalibration,
    resetCalibration,
    snapshot:
      cameraStatus === 'READY'
        ? { ...snapshot, cameraStatus, error: cameraError }
        : {
            ...snapshot,
            cameraStatus,
            engineStatus: snapshot.engineStatus,
            presenceStatus: 'UNKNOWN',
            error: cameraError,
          },
    startCalibration,
    subscribeFrame,
  }
}
