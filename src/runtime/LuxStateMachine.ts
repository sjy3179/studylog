import {
  DEFAULT_LUX_STABILITY_CONFIG,
  type LuxStabilityConfig,
} from '@/runtime/runtime-config'
import type { StableLuxSnapshot } from '@/runtime/runtime-types'
import type { LuxStatus } from '@/types/study'

const ORDER: LuxStatus[] = ['DARK', 'DIM', 'RECOMMENDED', 'BRIGHT', 'TOO_BRIGHT']

export class LuxStateMachine {
  private status: LuxStatus | null = null
  private changedAtMs = 0
  private candidateStatus: LuxStatus | null = null
  private candidateSinceMs: number | null = null
  private lastNowMs: number | null = null
  private lastLux = 620

  constructor(private config: LuxStabilityConfig = DEFAULT_LUX_STABILITY_CONFIG) {
    this.validateConfig(config)
  }

  update(lux: number, nowMs: number): StableLuxSnapshot {
    this.validateInput(lux, nowMs)
    if (this.lastNowMs !== null && nowMs < this.lastNowMs) return this.getSnapshot(this.lastNowMs)
    this.lastNowMs = nowMs
    this.lastLux = lux
    const raw = this.classify(lux)
    if (this.status === null) {
      this.status = raw
      this.changedAtMs = nowMs
      return this.getSnapshot(nowMs)
    }
    const eligible = this.withHysteresis(lux, raw)
    if (eligible === this.status) {
      this.candidateStatus = null
      this.candidateSinceMs = null
    } else if (this.candidateStatus !== eligible) {
      this.candidateStatus = eligible
      this.candidateSinceMs = nowMs
    } else if (nowMs - (this.candidateSinceMs ?? nowMs) >= this.config.holdMs) {
      this.status = eligible
      this.changedAtMs = nowMs
      this.candidateStatus = null
      this.candidateSinceMs = null
    }
    return this.getSnapshot(nowMs)
  }

  reset(nowMs: number): void {
    this.validateInput(0, nowMs)
    this.status = null
    this.changedAtMs = nowMs
    this.candidateStatus = null
    this.candidateSinceMs = null
    this.lastNowMs = nowMs
  }

  setConfig(config: LuxStabilityConfig, nowMs: number): void {
    this.validateConfig(config)
    this.config = config
    this.candidateStatus = null
    this.candidateSinceMs = null
    this.status = this.classify(this.lastLux)
    this.changedAtMs = nowMs
  }

  classify(lux: number): LuxStatus {
    if (lux < this.config.darkMax) return 'DARK'
    if (lux < this.config.dimMax) return 'DIM'
    if (lux <= this.config.recommendedMax) return 'RECOMMENDED'
    if (lux <= this.config.brightMax) return 'BRIGHT'
    return 'TOO_BRIGHT'
  }

  private getSnapshot(nowMs: number): StableLuxSnapshot {
    const status = this.status ?? this.classify(this.lastLux)
    return {
      timestampMs: nowMs,
      lux: this.lastLux,
      status,
      changedAtMs: this.changedAtMs,
      stateDurationMs: Math.max(0, nowMs - this.changedAtMs),
      isTransitioning: this.candidateStatus !== null,
      candidateStatus: this.candidateStatus,
      candidateDurationMs:
        this.candidateSinceMs === null ? 0 : Math.max(0, nowMs - this.candidateSinceMs),
    }
  }

  private withHysteresis(lux: number, raw: LuxStatus): LuxStatus {
    if (!this.status || raw === this.status) return raw
    const currentIndex = ORDER.indexOf(this.status)
    const rawIndex = ORDER.indexOf(raw)
    if (rawIndex > currentIndex) {
      const lower = [0, this.config.darkMax, this.config.dimMax, this.config.recommendedMax, this.config.brightMax][rawIndex]
      return lux >= lower + this.config.hysteresisLux ? raw : this.status
    }
    const currentLower = [0, this.config.darkMax, this.config.dimMax, this.config.recommendedMax, this.config.brightMax][currentIndex]
    return lux < currentLower - this.config.hysteresisLux ? raw : this.status
  }

  private validateInput(lux: number, nowMs: number): void {
    if (!Number.isFinite(lux) || lux < 0) throw new RangeError('lux must be non-negative and finite.')
    if (!Number.isFinite(nowMs) || nowMs < 0) throw new RangeError('nowMs must be non-negative and finite.')
  }

  private validateConfig(config: LuxStabilityConfig): void {
    if (!(config.darkMax < config.dimMax && config.dimMax < config.recommendedMax && config.recommendedMax < config.brightMax)) {
      throw new RangeError('Lux thresholds must be strictly increasing.')
    }
  }
}
