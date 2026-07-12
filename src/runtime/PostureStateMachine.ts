import {
  DEFAULT_POSTURE_STABILITY_CONFIG,
  type PostureStabilityConfig,
} from '@/runtime/runtime-config'
import type {
  BadPostureReason,
  FusedPostureObservation,
  PostureHistoryEntry,
  StablePostureSnapshot,
} from '@/runtime/runtime-types'
import type { StablePostureState } from '@/types/study'

export class PostureStateMachine {
  private history: PostureHistoryEntry[] = []
  private state: StablePostureState = 'UNKNOWN'
  private badReason: BadPostureReason | null = null
  private confidence: number | null = null
  private changedAtMs = 0
  private candidateState: StablePostureState | null = null
  private candidateSinceMs: number | null = null
  private consensusCount = 0
  private noPoseSinceMs: number | null = null
  private unknownSinceMs: number | null = null
  private lastTimestampMs: number | null = null

  constructor(private readonly config: PostureStabilityConfig = DEFAULT_POSTURE_STABILITY_CONFIG) {}

  update(observation: FusedPostureObservation, nowMs: number): StablePostureSnapshot {
    this.assertTime(nowMs)
    if (this.lastTimestampMs !== null && nowMs < this.lastTimestampMs) {
      return this.getSnapshot(this.lastTimestampMs)
    }
    if (observation.timestampMs === this.history.at(-1)?.timestampMs) {
      this.lastTimestampMs = nowMs
      return this.getSnapshot(nowMs)
    }
    this.lastTimestampMs = nowMs
    this.pushHistory(observation)

    if (observation.rawState === 'NO_POSE') {
      this.handleNoPose(nowMs)
    } else if (observation.rawState === 'UNKNOWN') {
      this.handleUnknown(nowMs)
    } else {
      this.noPoseSinceMs = null
      this.unknownSinceMs = null
      this.handleConsensus(observation, nowMs)
    }
    return this.getSnapshot(nowMs)
  }

  getSnapshot(nowMs: number): StablePostureSnapshot {
    const effectiveNow = Math.max(nowMs, this.lastTimestampMs ?? nowMs)
    return {
      timestampMs: effectiveNow,
      state: this.state,
      badReason: this.badReason,
      confidence: this.confidence,
      changedAtMs: this.changedAtMs,
      stateDurationMs: Math.max(0, effectiveNow - this.changedAtMs),
      isTransitioning: this.candidateState !== null,
      candidateState: this.candidateState,
      candidateDurationMs:
        this.candidateSinceMs === null ? 0 : Math.max(0, effectiveNow - this.candidateSinceMs),
      history: this.history.map((entry) => ({ ...entry })),
      consensusCount: this.consensusCount,
    }
  }

  reset(nowMs: number): void {
    this.assertTime(nowMs)
    this.history = []
    this.state = 'UNKNOWN'
    this.badReason = null
    this.confidence = null
    this.changedAtMs = nowMs
    this.candidateState = null
    this.candidateSinceMs = null
    this.consensusCount = 0
    this.noPoseSinceMs = null
    this.unknownSinceMs = null
    this.lastTimestampMs = nowMs
  }

  private handleNoPose(nowMs: number): void {
    this.unknownSinceMs = null
    this.noPoseSinceMs ??= nowMs
    this.setCandidate('AWAY', this.noPoseSinceMs, 0)
    if (nowMs - this.noPoseSinceMs >= this.config.awayHoldMs) {
      this.commit('AWAY', null, null, nowMs)
    }
  }

  private handleUnknown(nowMs: number): void {
    this.noPoseSinceMs = null
    this.unknownSinceMs ??= nowMs
    this.setCandidate('UNKNOWN', this.unknownSinceMs, 0)
    if (nowMs - this.unknownSinceMs > this.config.unknownGraceMs) {
      this.commit('UNKNOWN', null, null, nowMs)
    }
  }

  private handleConsensus(observation: FusedPostureObservation, nowMs: number): void {
    const candidate = observation.rawState
    const matching = this.history.filter((entry) => entry.rawState === candidate)
    this.consensusCount = matching.length
    if (matching.length < this.config.consensusCount) {
      this.clearCandidate()
      return
    }
    const stableCandidate: StablePostureState = candidate === 'GOOD' ? 'GOOD' : 'BAD'
    if (stableCandidate === this.state) {
      if (stableCandidate === 'BAD') this.badReason = this.representativeBadReason()
      this.confidence = observation.tmConfidence
      this.clearCandidate()
      return
    }
    if (this.candidateState !== stableCandidate) {
      this.setCandidate(stableCandidate, nowMs, matching.length)
      return
    }
    this.consensusCount = matching.length
    const holdMs = stableCandidate === 'GOOD' ? this.config.goodHoldMs : this.config.badHoldMs
    if (nowMs - (this.candidateSinceMs ?? nowMs) < holdMs) return
    const reason = stableCandidate === 'BAD' ? this.representativeBadReason() : null
    this.commit(stableCandidate, reason, observation.tmConfidence, nowMs)
  }

  private pushHistory(observation: FusedPostureObservation): void {
    this.history.push({
      timestampMs: observation.timestampMs,
      rawState: observation.rawState,
      badReason: observation.badReason,
    })
    if (this.history.length > this.config.windowSize) this.history.shift()
  }

  private representativeBadReason(): BadPostureReason | null {
    const badEntries = this.history.filter((entry) => entry.rawState === 'BAD' && entry.badReason)
    if (!badEntries.length) return null
    const counts = new Map<BadPostureReason, number>()
    for (const entry of badEntries) {
      const reason = entry.badReason!
      counts.set(reason, (counts.get(reason) ?? 0) + 1)
    }
    return [...badEntries]
      .reverse()
      .map((entry) => entry.badReason!)
      .sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0))[0]
  }

  private setCandidate(state: StablePostureState, sinceMs: number, count: number): void {
    this.candidateState = state
    this.candidateSinceMs = sinceMs
    this.consensusCount = count
  }

  private clearCandidate(): void {
    this.candidateState = null
    this.candidateSinceMs = null
    this.consensusCount = 0
  }

  private commit(
    state: StablePostureState,
    reason: BadPostureReason | null,
    confidence: number | null,
    nowMs: number,
  ): void {
    if (state !== this.state || reason !== this.badReason) this.changedAtMs = nowMs
    this.state = state
    this.badReason = reason
    this.confidence = confidence
    if (state === 'AWAY' || state === 'UNKNOWN') {
      this.history = this.history.filter((entry) =>
        state === 'AWAY' ? entry.rawState === 'NO_POSE' : entry.rawState === 'UNKNOWN',
      )
    }
    this.clearCandidate()
  }

  private assertTime(nowMs: number): void {
    if (!Number.isFinite(nowMs) || nowMs < 0) throw new RangeError('nowMs must be non-negative and finite.')
  }
}
