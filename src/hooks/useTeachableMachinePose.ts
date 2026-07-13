import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

import type { PostureClassifierInput } from '@/ai/PostureClassifier'
import { TeachableMachinePoseClassifier } from '@/ai/tm-pose/TeachableMachinePoseClassifier'
import { toTmPoseError } from '@/ai/tm-pose/tm-pose-errors'
import { TmPoseInferenceScheduler } from '@/ai/tm-pose/TmPoseInferenceScheduler'
import type {
  TmPoseEngineStatus,
  TmPoseRuntimeSnapshot,
} from '@/ai/tm-pose/tm-pose-types'
import type { CameraStatus } from '@/camera/camera-types'

interface UseTeachableMachinePoseOptions {
  cameraStatus: CameraStatus
  mirrorCamera: boolean
  pauseInference?: boolean
  videoRef: RefObject<HTMLVideoElement | null>
}

export interface UseTeachableMachinePoseResult {
  continueWithMock: () => void
  inputCanvas: HTMLCanvasElement | null
  prepareModel: () => Promise<void>
  retry: () => Promise<void>
  snapshot: TmPoseRuntimeSnapshot
}

const INITIAL_SNAPSHOT: TmPoseRuntimeSnapshot = {
  averageInferenceMs: 0,
  currentIntervalMs: 400,
  enabled: true,
  error: null,
  estimatedHz: 2.5,
  modelInfo: null,
  prediction: null,
  status: 'IDLE',
}

export function useTeachableMachinePose({
  cameraStatus,
  mirrorCamera,
  pauseInference = false,
  videoRef,
}: UseTeachableMachinePoseOptions): UseTeachableMachinePoseResult {
  const [snapshot, setSnapshot] = useState<TmPoseRuntimeSnapshot>(INITIAL_SNAPSHOT)
  const [inputCanvas, setInputCanvas] = useState<HTMLCanvasElement | null>(null)
  const cameraStatusRef = useRef(cameraStatus)
  const classifierRef = useRef<TeachableMachinePoseClassifier | null>(null)
  const enabledRef = useRef(true)
  const initializingRef = useRef<Promise<void> | null>(null)
  const mirrorRef = useRef(mirrorCamera)
  const mountedRef = useRef(true)
  const pauseInferenceRef = useRef(pauseInference)
  const schedulerRef = useRef<TmPoseInferenceScheduler | null>(null)

  useEffect(() => {
    cameraStatusRef.current = cameraStatus
  }, [cameraStatus])
  useEffect(() => {
    mirrorRef.current = mirrorCamera
  }, [mirrorCamera])
  useEffect(() => {
    pauseInferenceRef.current = pauseInference
  }, [pauseInference])

  const buildClassifier = useCallback(() => {
    const classifier = new TeachableMachinePoseClassifier({
      onStatusChange: (status: TmPoseEngineStatus) => {
        if (!mountedRef.current || classifierRef.current !== classifier) return
        setSnapshot((current) => ({ ...current, status }))
      },
    })
    classifierRef.current = classifier
    setInputCanvas(classifier.getInputCanvas())
    return classifier
  }, [])

  const ensureInitialized = useCallback(async () => {
    if (!enabledRef.current) return
    if (initializingRef.current) return initializingRef.current
    const classifier = classifierRef.current ?? buildClassifier()
    if (classifier.getStatus() === 'READY' || classifier.getStatus() === 'RUNNING') {
      schedulerRef.current?.start()
      return
    }

    const initializePromise = classifier
      .initialize()
      .then(() => {
        if (!mountedRef.current || classifierRef.current !== classifier) return
        const scheduler = new TmPoseInferenceScheduler({
          canRun: () => {
            const video = videoRef.current
            return Boolean(
              enabledRef.current &&
                !pauseInferenceRef.current &&
                cameraStatusRef.current === 'READY' &&
                video &&
                !video.paused &&
                video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
                video.videoWidth > 0 &&
                video.videoHeight > 0,
            )
          },
          getVideoTime: () => videoRef.current?.currentTime ?? -1,
          onError: (error) => {
            if (!mountedRef.current) return
            setSnapshot((current) => ({
              ...current,
              error: toTmPoseError(error, 'PREDICTION_FAILED'),
              status: 'ERROR',
            }))
          },
          onPrediction: (prediction) => {
            if (!mountedRef.current || classifierRef.current !== classifier) return
            const metrics = scheduler.getMetrics()
            setSnapshot((current) => ({
              ...current,
              averageInferenceMs: metrics.averageInferenceMs,
              currentIntervalMs: metrics.currentIntervalMs,
              enabled: true,
              error: null,
              estimatedHz: metrics.estimatedHz,
              modelInfo: classifier.getModelInfo(),
              prediction,
              status: 'RUNNING',
            }))
          },
          predict: (timestampMs) => {
            const video = videoRef.current
            if (!video) return Promise.reject(new Error('카메라 video가 없습니다.'))
            const input: PostureClassifierInput = {
              mirrorCamera: mirrorRef.current,
              timestampMs,
              video,
            }
            return classifier.predict(input)
          },
        })
        schedulerRef.current = scheduler
        setSnapshot((current) => ({
          ...current,
          error: null,
          modelInfo: classifier.getModelInfo(),
          status: cameraStatusRef.current === 'READY' ? 'RUNNING' : 'PAUSED',
        }))
        if (cameraStatusRef.current === 'READY' && !pauseInferenceRef.current) scheduler.start()
      })
      .catch((error) => {
        if (!mountedRef.current || classifierRef.current !== classifier) return
        setSnapshot((current) => ({
          ...current,
          error: toTmPoseError(error, 'MODEL_LOAD_FAILED'),
          status: 'ERROR',
        }))
      })
      .finally(() => {
        if (initializingRef.current === initializePromise) initializingRef.current = null
      })
    initializingRef.current = initializePromise
    return initializePromise
  }, [buildClassifier, videoRef])

  useEffect(() => {
    if (cameraStatus === 'READY' && enabledRef.current && !pauseInference) {
      void ensureInitialized()
    } else {
      schedulerRef.current?.stop()
      setSnapshot((current) => ({
        ...current,
        status:
          current.status === 'RUNNING' || current.status === 'READY'
            ? 'PAUSED'
            : current.status,
      }))
    }
  }, [cameraStatus, ensureInitialized, pauseInference])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      schedulerRef.current?.stop()
      schedulerRef.current = null
      void classifierRef.current?.dispose()
      classifierRef.current = null
    }
  }, [])

  const continueWithMock = useCallback(() => {
    enabledRef.current = false
    schedulerRef.current?.stop()
    setSnapshot((current) => ({ ...current, enabled: false, status: 'PAUSED' }))
  }, [])

  const retry = useCallback(async () => {
    enabledRef.current = true
    schedulerRef.current?.stop()
    schedulerRef.current = null
    initializingRef.current = null
    const previous = classifierRef.current
    classifierRef.current = null
    setInputCanvas(null)
    if (previous) await previous.dispose()
    setSnapshot({ ...INITIAL_SNAPSHOT, enabled: true })
    buildClassifier()
    await ensureInitialized()
  }, [buildClassifier, ensureInitialized])

  return {
    continueWithMock,
    inputCanvas,
    prepareModel: ensureInitialized,
    retry,
    snapshot,
  }
}
