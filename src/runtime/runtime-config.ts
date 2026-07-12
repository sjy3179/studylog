export interface RuntimeFreshnessConfig {
  tmMaxAgeMs: number
  mediaPipeMaxAgeMs: number
}

export interface PostureFusionConfig {
  tmMinimumConfidence: number
  mediaPipeBadDeviationThreshold: number
  freshness: RuntimeFreshnessConfig
  requireCalibrationForGood: boolean
}

export interface PostureStabilityConfig {
  windowSize: number
  consensusCount: number
  goodHoldMs: number
  badHoldMs: number
  awayHoldMs: number
  unknownGraceMs: number
}

export interface LuxStabilityConfig {
  darkMax: number
  dimMax: number
  recommendedMax: number
  brightMax: number
  holdMs: number
  hysteresisLux: number
}

export interface AlertConfig {
  postureHoldMs: number
  postureCooldownMs: number
  luxCooldownMs: number
}

export const DEFAULT_POSTURE_FUSION_CONFIG: PostureFusionConfig = {
  tmMinimumConfidence: 0.55,
  mediaPipeBadDeviationThreshold: 0.65,
  freshness: { tmMaxAgeMs: 1_000, mediaPipeMaxAgeMs: 600 },
  requireCalibrationForGood: true,
}

export const DEFAULT_POSTURE_STABILITY_CONFIG: PostureStabilityConfig = {
  windowSize: 12,
  consensusCount: 8,
  goodHoldMs: 1_500,
  badHoldMs: 3_000,
  awayHoldMs: 2_500,
  unknownGraceMs: 2_000,
}

export const DEFAULT_LUX_STABILITY_CONFIG: LuxStabilityConfig = {
  darkMax: 300,
  dimMax: 500,
  recommendedMax: 700,
  brightMax: 1_000,
  holdMs: 3_000,
  hysteresisLux: 20,
}

export const DEFAULT_ALERT_CONFIG: AlertConfig = {
  postureHoldMs: 15_000,
  postureCooldownMs: 120_000,
  luxCooldownMs: 60_000,
}

export const RUNTIME_TICK_MS = 250
