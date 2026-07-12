import { CALIBRATION_CONFIG } from '@/ai/pose-config'
import { clamp, median, medianAbsoluteDeviation } from '@/ai/pose-statistics'
import type {
  CalibrationContext,
  CalibrationProfile,
  CalibrationQuality,
  CalibrationStatus,
  PostureFeatures,
} from '@/ai/pose-types'

type Clock = () => number

function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `calibration-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export class CalibrationManager {
  private readonly clock: Clock
  private collectionStartedAt: number | null = null
  private countdownStartedAt: number | null = null
  private observationCount = 0
  private quality: CalibrationQuality | null = null
  private samples: PostureFeatures[] = []
  private status: CalibrationStatus = 'NOT_CALIBRATED'

  constructor(clock: Clock = () => performance.now()) {
    this.clock = clock
  }

  markReady(hasCalibration = false): void {
    if (this.status === 'COUNTDOWN' || this.status === 'COLLECTING' || this.status === 'PROCESSING') return
    this.status = hasCalibration ? 'CALIBRATED' : 'READY_TO_START'
  }

  start(): void {
    if (this.status === 'COUNTDOWN' || this.status === 'COLLECTING' || this.status === 'PROCESSING') return
    this.samples = []
    this.observationCount = 0
    this.quality = null
    this.countdownStartedAt = this.clock()
    this.collectionStartedAt = null
    this.status = 'COUNTDOWN'
  }

  update(timestampMs = this.clock()): CalibrationStatus {
    if (this.status === 'COUNTDOWN' && this.countdownStartedAt !== null) {
      if (timestampMs - this.countdownStartedAt >= CALIBRATION_CONFIG.countdownMs) {
        this.collectionStartedAt = this.countdownStartedAt + CALIBRATION_CONFIG.countdownMs
        this.status = 'COLLECTING'
      }
    }
    if (this.status === 'COLLECTING' && this.collectionStartedAt !== null) {
      if (timestampMs - this.collectionStartedAt >= CALIBRATION_CONFIG.collectionMs) {
        this.status = 'PROCESSING'
      }
    }
    return this.status
  }

  recordObservation(features: PostureFeatures | null, timestampMs = this.clock()): void {
    this.update(timestampMs)
    if (this.status !== 'COLLECTING') return
    this.observationCount += 1
    if (features) this.samples.push(features)
  }

  addSample(features: PostureFeatures, timestampMs: number): void {
    this.recordObservation(features, timestampMs)
  }

  cancel(): void {
    if (
      this.status !== 'COUNTDOWN' &&
      this.status !== 'COLLECTING' &&
      this.status !== 'PROCESSING' &&
      this.status !== 'FAILED'
    ) return
    this.status = 'CANCELLED'
  }

  canFinish(): boolean {
    return this.samples.length >= CALIBRATION_CONFIG.minimumSamples
  }

  finish(context: CalibrationContext): CalibrationProfile {
    if (this.status !== 'PROCESSING' && this.status !== 'COLLECTING') {
      throw new Error('Calibration is not ready to finish.')
    }
    if (!this.canFinish()) {
      this.status = 'FAILED'
      throw new Error(`유효 자세 샘플이 ${CALIBRATION_CONFIG.minimumSamples}개보다 적습니다.`)
    }

    const numberValues = <K extends keyof PostureFeatures>(key: K): number[] =>
      this.samples
        .map((sample) => sample[key])
        .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
    const noseValues = numberValues('noseToShoulderVerticalRatio')
    const tiltValues = numberValues('shoulderTiltRatio')
    const offsetValues = numberValues('headHorizontalOffsetRatio')
    const faceValues = numberValues('faceScaleRatio')
    const movementScore = clamp(
      (medianAbsoluteDeviation(noseValues) / 0.08 +
        medianAbsoluteDeviation(tiltValues) / 0.06 +
        medianAbsoluteDeviation(offsetValues) / 0.08) /
        3,
      0,
      1,
    )
    const validSampleRatio = this.samples.length / Math.max(1, this.observationCount)
    const warnings: string[] = []
    if (movementScore > CALIBRATION_CONFIG.maximumMovementScore) {
      warnings.push('기준 자세를 등록하는 동안 움직임이 많았습니다.')
    }
    if (validSampleRatio < CALIBRATION_CONFIG.minimumValidSampleRatio) {
      warnings.push('유효한 자세 샘플 비율이 낮습니다.')
    }
    const acceptable = warnings.length === 0
    this.quality = { validSampleRatio, movementScore, acceptable, warnings }
    if (!acceptable) {
      this.status = 'FAILED'
      throw new Error(`${warnings.join(' ')} 편안한 자세를 유지한 뒤 다시 시도해 주세요.`)
    }

    const profile: CalibrationProfile = {
      id: createId(),
      version: 1,
      createdAt: context.createdAt ?? new Date().toISOString(),
      cameraDeviceId: context.cameraDeviceId,
      sampleCount: this.samples.length,
      baseline: {
        noseToShoulderVerticalRatio: median(noseValues),
        shoulderTiltRatio: median(tiltValues),
        headHorizontalOffsetRatio: median(offsetValues),
        faceScaleRatio:
          faceValues.length >= Math.ceil(CALIBRATION_CONFIG.minimumSamples / 2)
            ? median(faceValues)
            : null,
      },
      quality: { validSampleRatio, movementScore },
    }
    this.status = 'CALIBRATED'
    return profile
  }

  reset(): void {
    this.samples = []
    this.observationCount = 0
    this.quality = null
    this.countdownStartedAt = null
    this.collectionStartedAt = null
    this.status = 'NOT_CALIBRATED'
  }

  getStatus(): CalibrationStatus {
    return this.status
  }

  getProgress(timestampMs = this.clock()): number {
    if (this.status === 'COUNTDOWN' && this.countdownStartedAt !== null) {
      return clamp((timestampMs - this.countdownStartedAt) / CALIBRATION_CONFIG.countdownMs, 0, 1)
    }
    if (this.status === 'COLLECTING' && this.collectionStartedAt !== null) {
      return clamp((timestampMs - this.collectionStartedAt) / CALIBRATION_CONFIG.collectionMs, 0, 1)
    }
    return this.status === 'PROCESSING' || this.status === 'CALIBRATED' ? 1 : 0
  }

  getCountdownSeconds(timestampMs = this.clock()): number {
    if (this.status !== 'COUNTDOWN' || this.countdownStartedAt === null) return 0
    const remaining = CALIBRATION_CONFIG.countdownMs - (timestampMs - this.countdownStartedAt)
    return Math.max(1, Math.ceil(remaining / 1_000))
  }

  getSampleCount(): number {
    return this.samples.length
  }

  getQuality(): CalibrationQuality | null {
    return this.quality
  }
}
