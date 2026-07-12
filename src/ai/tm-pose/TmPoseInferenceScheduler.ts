import type { BrowserAiInferenceCoordinator } from '@/ai/BrowserAiInferenceCoordinator'
import { browserAiInferenceCoordinator } from '@/ai/BrowserAiInferenceCoordinator'
import { TM_POSE_INFERENCE_CONFIG } from '@/ai/tm-pose/tm-pose-config'
import type { TmPosePredictionResult } from '@/ai/tm-pose/tm-pose-types'

interface SchedulerOptions {
  cancelFrame?: (id: number) => void
  canRun: () => boolean
  coordinator?: BrowserAiInferenceCoordinator
  getVideoTime: () => number
  isHidden?: () => boolean
  onError: (error: unknown) => void
  onPrediction: (prediction: TmPosePredictionResult) => void
  predict: (timestampMs: number) => Promise<TmPosePredictionResult>
  requestFrame?: (callback: FrameRequestCallback) => number
}

export interface TmPoseSchedulerMetrics {
  averageInferenceMs: number
  currentIntervalMs: number
  estimatedHz: number
  inferenceInFlight: boolean
  running: boolean
}

export class TmPoseInferenceScheduler {
  private readonly cancelFrame: (id: number) => void
  private readonly canRun: () => boolean
  private readonly coordinator: BrowserAiInferenceCoordinator
  private readonly getVideoTime: () => number
  private readonly isHidden: () => boolean
  private readonly onError: (error: unknown) => void
  private readonly onPrediction: (prediction: TmPosePredictionResult) => void
  private readonly predict: (timestampMs: number) => Promise<TmPosePredictionResult>
  private readonly requestFrame: (callback: FrameRequestCallback) => number
  private animationFrameId = 0
  private currentIntervalMs: number = TM_POSE_INFERENCE_CONFIG.initialIntervalMs
  private inferenceDurations: number[] = []
  private inferenceInFlight = false
  private lastInferenceAt = -Infinity
  private lastVideoTime = -1
  private running = false
  private startedAt: number | null = null

  constructor(options: SchedulerOptions) {
    this.cancelFrame =
      options.cancelFrame ?? ((animationFrameId) => window.cancelAnimationFrame(animationFrameId))
    this.canRun = options.canRun
    this.coordinator = options.coordinator ?? browserAiInferenceCoordinator
    this.getVideoTime = options.getVideoTime
    this.isHidden = options.isHidden ?? (() => document.hidden)
    this.onError = options.onError
    this.onPrediction = options.onPrediction
    this.predict = options.predict
    this.requestFrame =
      options.requestFrame ?? ((callback) => window.requestAnimationFrame(callback))
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.lastInferenceAt = -Infinity
    this.startedAt = null
    this.animationFrameId = this.requestFrame(this.run)
  }

  stop(): void {
    this.running = false
    this.cancelFrame(this.animationFrameId)
    this.animationFrameId = 0
  }

  getMetrics(): TmPoseSchedulerMetrics {
    const averageInferenceMs = this.inferenceDurations.length
      ? this.inferenceDurations.reduce((sum, value) => sum + value, 0) /
        this.inferenceDurations.length
      : 0
    return {
      averageInferenceMs,
      currentIntervalMs: this.currentIntervalMs,
      estimatedHz: 1_000 / this.currentIntervalMs,
      inferenceInFlight: this.inferenceInFlight,
      running: this.running,
    }
  }

  private readonly run = (now: number): void => {
    if (!this.running) return
    this.animationFrameId = this.requestFrame(this.run)
    const videoTime = this.getVideoTime()
    this.startedAt ??= now
    if (
      this.isHidden() ||
      !this.canRun() ||
      this.inferenceInFlight ||
      videoTime < 0 ||
      videoTime === this.lastVideoTime ||
      now - this.startedAt < TM_POSE_INFERENCE_CONFIG.initialOffsetMs ||
      now - this.lastInferenceAt < this.currentIntervalMs ||
      !this.coordinator.tryAcquire('TM_POSE')
    ) {
      return
    }

    this.inferenceInFlight = true
    this.lastInferenceAt = now
    this.lastVideoTime = videoTime
    void this.predict(now)
      .then((prediction) => {
        if (!this.running) return
        this.inferenceDurations.push(prediction.inferenceMs)
        if (this.inferenceDurations.length > 10) this.inferenceDurations.shift()
        this.adaptInterval()
        this.onPrediction(prediction)
      })
      .catch((error) => {
        if (this.running) this.onError(error)
      })
      .finally(() => {
        this.inferenceInFlight = false
        this.coordinator.release('TM_POSE')
      })
  }

  private adaptInterval(): void {
    const average = this.getMetrics().averageInferenceMs
    this.currentIntervalMs =
      average > TM_POSE_INFERENCE_CONFIG.slowInferenceThresholdMs
        ? TM_POSE_INFERENCE_CONFIG.slowIntervalMs
        : average > TM_POSE_INFERENCE_CONFIG.mediumInferenceThresholdMs
          ? TM_POSE_INFERENCE_CONFIG.mediumIntervalMs
          : TM_POSE_INFERENCE_CONFIG.initialIntervalMs
  }
}
