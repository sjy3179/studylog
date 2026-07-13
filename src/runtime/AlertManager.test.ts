import { describe, expect, it } from 'vitest'

import { AlertManager } from '@/runtime/AlertManager'
import type { StablePostureSnapshot } from '@/runtime/runtime-types'

function posture(state: StablePostureSnapshot['state'] = 'BAD'): StablePostureSnapshot {
  return {
    timestampMs: 0,
    state,
    badReason: state === 'BAD' ? 'FORWARD_LEAN' : null,
    confidence: 0.9,
    changedAtMs: 0,
    stateDurationMs: 0,
    isTransitioning: false,
    candidateState: null,
    candidateDurationMs: 0,
    history: [],
    consensusCount: 8,
  }
}

function input(nowMs: number, overrides = {}) {
  return {
    nowMs,
    lifecycle: 'RUNNING' as const,
    posture: posture(),
    luxStatus: 'RECOMMENDED' as const,
    runtimeReady: true,
    enabled: true,
    ...overrides,
  }
}

describe('AlertManager', () => {
  it('warns after 15 seconds of BAD and observes the 120 second cooldown', () => {
    const manager = new AlertManager()
    expect(manager.update(input(0))).toHaveLength(0)
    expect(manager.update(input(14_999))).toHaveLength(0)
    expect(manager.update(input(15_000))).toHaveLength(1)
    expect(manager.update(input(100_000))).toHaveLength(0)
    expect(manager.update(input(135_000))).toHaveLength(1)
  })

  it('resets BAD duration when posture recovers and suppresses paused or away alerts', () => {
    const manager = new AlertManager()
    manager.update(input(0))
    manager.update(input(10_000, { posture: posture('GOOD') }))
    expect(manager.update(input(20_000))).toHaveLength(0)
    expect(manager.update(input(40_000, { lifecycle: 'PAUSED' }))).toHaveLength(0)
    expect(manager.update(input(60_000, { posture: posture('AWAY') }))).toHaveLength(0)
  })

  it('warns for stable DARK and TOO_BRIGHT with a 60 second cooldown', () => {
    const manager = new AlertManager()
    expect(manager.update(input(0, { posture: posture('GOOD'), luxStatus: 'DARK' }))[0]?.type).toBe('LUX_DARK')
    expect(manager.update(input(30_000, { posture: posture('GOOD'), luxStatus: 'DARK' }))).toHaveLength(0)
    expect(manager.update(input(60_000, { posture: posture('GOOD'), luxStatus: 'DARK' }))).toHaveLength(1)
  })
})
