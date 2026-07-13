import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'

import {
  MEDIAPIPE_WASM_PATH,
  POSE_ENGINE_OPTIONS,
  POSE_LANDMARKER_MODEL_PATH,
} from '@/ai/pose-config'
import type {
  NormalizedPoseLandmark,
  PoseEngineErrorInfo,
  PoseEngineStatus,
  PoseFrameResult,
  WorldPoseLandmark,
} from '@/ai/pose-types'
import { validatePoseLandmarks } from '@/ai/pose-validation'

export interface PoseConnection {
  start: number
  end: number
}

function mapLandmark(landmark: {
  x: number
  y: number
  z: number
  visibility?: number
  presence?: number
}): NormalizedPoseLandmark {
  return {
    x: landmark.x,
    y: landmark.y,
    z: landmark.z,
    visibility: Number.isFinite(landmark.visibility) ? (landmark.visibility ?? null) : null,
    presence: Number.isFinite(landmark.presence) ? (landmark.presence ?? null) : null,
  }
}

function mapEngineError(error: unknown, stage: 'initialize' | 'detect'): PoseEngineErrorInfo {
  const message = error instanceof Error ? error.message : String(error)
  if (stage === 'detect') return { code: 'INFERENCE_ERROR', message }
  if (message.includes('wasm') || message.includes('WASM')) {
    return { code: 'WASM_ASSET_ERROR', message }
  }
  if (message.includes('.task') || message.includes('model')) {
    return { code: 'MODEL_ASSET_ERROR', message }
  }
  return { code: 'INITIALIZATION_ERROR', message }
}

export class MediaPipePoseEngine {
  static readonly connections: readonly PoseConnection[] = PoseLandmarker.POSE_CONNECTIONS.map(
    ({ start, end }) => ({ start, end }),
  )

  private initializePromise: Promise<void> | null = null
  private generation = 0
  private landmarker: PoseLandmarker | null = null
  private lastError: PoseEngineErrorInfo | null = null
  private status: PoseEngineStatus = 'IDLE'

  async initialize(): Promise<void> {
    if (this.landmarker && (this.status === 'READY' || this.status === 'RUNNING' || this.status === 'PAUSED')) {
      return
    }
    if (this.initializePromise) return this.initializePromise
    if (this.status === 'DISPOSED') this.status = 'IDLE'

    this.initializePromise = this.initializeInternal().finally(() => {
      this.initializePromise = null
    })
    return this.initializePromise
  }

  private async initializeInternal(): Promise<void> {
    const initializeGeneration = this.generation
    this.lastError = null
    this.status = 'LOADING_ASSETS'
    try {
      const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_PATH)
      this.status = 'INITIALIZING'

      const create = (delegate: 'GPU' | 'CPU') =>
        PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            delegate,
            modelAssetPath: POSE_LANDMARKER_MODEL_PATH,
          },
          runningMode: 'VIDEO',
          ...POSE_ENGINE_OPTIONS,
        })

      let landmarker: PoseLandmarker
      try {
        landmarker = await create('GPU')
      } catch {
        landmarker = await create('CPU')
      }
      if (initializeGeneration !== this.generation) {
        landmarker.close()
        throw Object.assign(new Error('Pose engine initialization was cancelled.'), {
          name: 'AbortError',
        })
      }
      this.landmarker = landmarker
      this.status = 'READY'
    } catch (error) {
      this.landmarker?.close()
      this.landmarker = null
      if (error instanceof Error && error.name === 'AbortError') {
        this.status = 'DISPOSED'
        throw error
      }
      this.lastError = mapEngineError(error, 'initialize')
      this.status = 'ERROR'
      throw error
    }
  }

  detect(video: HTMLVideoElement, timestampMs: number): PoseFrameResult {
    if (!this.landmarker || !this.isReady()) {
      throw new Error('Pose engine is not ready.')
    }

    const startedAt = performance.now()
    try {
      const result = this.landmarker.detectForVideo(video, timestampMs)
      const landmarks = (result.landmarks[0] ?? []).map(mapLandmark)
      const worldLandmarks = result.worldLandmarks[0]?.map(mapLandmark) as
        | WorldPoseLandmark[]
        | undefined
      const validation = validatePoseLandmarks(landmarks)
      this.status = 'RUNNING'

      return {
        timestampMs,
        detected: validation.detected,
        landmarks,
        worldLandmarks: worldLandmarks ?? null,
        inferenceMs: performance.now() - startedAt,
        sourceWidth: video.videoWidth,
        sourceHeight: video.videoHeight,
        validLandmarkCount: validation.validLandmarkCount,
      }
    } catch (error) {
      this.lastError = mapEngineError(error, 'detect')
      this.status = 'ERROR'
      throw error
    }
  }

  pause(): void {
    if (this.status === 'RUNNING' || this.status === 'READY') this.status = 'PAUSED'
  }

  resume(): void {
    if (this.status === 'PAUSED' && this.landmarker) this.status = 'READY'
  }

  isReady(): boolean {
    return Boolean(
      this.landmarker &&
        (this.status === 'READY' || this.status === 'RUNNING' || this.status === 'PAUSED'),
    )
  }

  getStatus(): PoseEngineStatus {
    return this.status
  }

  getError(): PoseEngineErrorInfo | null {
    return this.lastError
  }

  dispose(): void {
    this.generation += 1
    this.landmarker?.close()
    this.landmarker = null
    this.initializePromise = null
    this.status = 'DISPOSED'
  }
}
