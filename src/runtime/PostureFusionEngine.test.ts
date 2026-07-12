import { describe, expect, it } from 'vitest'

import { PostureFusionEngine } from '@/runtime/PostureFusionEngine'
import type { MediaPipePostureSignal, TmPoseSignal } from '@/runtime/runtime-types'

const probabilities = {
  GOOD_POSTURE: 0.9,
  FORWARD_LEAN: 0.04,
  SIDE_LEAN: 0.03,
  RESTING: 0.03,
}

function media(overrides: Partial<MediaPipePostureSignal> = {}): MediaPipePostureSignal {
  return {
    timestampMs: 1_000,
    poseDetected: true,
    deviationScore: 0.2,
    deviationReasons: [],
    inferenceMs: 12,
    calibrationAvailable: true,
    ...overrides,
  }
}

function tm(overrides: Partial<TmPoseSignal> = {}): TmPoseSignal {
  return {
    timestampMs: 1_000,
    label: 'GOOD_POSTURE',
    confidence: 0.9,
    probabilities,
    inferenceMs: 30,
    modelVersion: 'pilot-v2',
    ...overrides,
  }
}

describe('PostureFusionEngine', () => {
  const engine = new PostureFusionEngine()
  const fuse = (tmPrediction: TmPoseSignal | null, mediaPipeSignal: MediaPipePostureSignal | null, nowMs = 1_100) =>
    engine.fuse({ nowMs, tmPrediction, mediaPipeSignal })

  it('returns UNKNOWN when MediaPipe is absent or stale', () => {
    expect(fuse(tm(), null).rawState).toBe('UNKNOWN')
    expect(fuse(tm(), media({ timestampMs: 400 }), 1_100).reasonCode).toBe('MEDIAPIPE_STALE')
  })

  it('treats a slightly future rAF timestamp as age zero', () => {
    expect(fuse(tm({ timestampMs: 1_101 }), media({ timestampMs: 1_101 }), 1_100).rawState).toBe('GOOD')
  })

  it('prioritizes fresh pose absence over the last TM GOOD', () => {
    expect(fuse(tm(), media({ poseDetected: false }))).toMatchObject({ rawState: 'NO_POSE', reasonCode: 'NO_POSE' })
  })

  it('returns UNKNOWN when TM is absent, stale, or below confidence', () => {
    expect(fuse(null, media()).reasonCode).toBe('TM_NOT_READY')
    expect(fuse(tm({ timestampMs: 0 }), media()).reasonCode).toBe('TM_STALE')
    expect(fuse(tm({ confidence: 0.54 }), media()).reasonCode).toBe('TM_LOW_CONFIDENCE')
  })

  it.each([
    ['FORWARD_LEAN', 'FORWARD_LEAN'],
    ['SIDE_LEAN', 'SIDE_LEAN'],
    ['RESTING', 'RESTING'],
  ] as const)('maps %s to BAD/%s', (label, reason) => {
    expect(fuse(tm({ label, confidence: 0.9 }), media())).toMatchObject({ rawState: 'BAD', badReason: reason })
  })

  it('accepts calibrated GOOD with low deviation', () => {
    expect(fuse(tm(), media())).toMatchObject({ rawState: 'GOOD', reasonCode: 'TM_GOOD_MEDIAPIPE_NORMAL' })
  })

  it('downgrades TM GOOD when baseline deviation is high', () => {
    expect(fuse(tm(), media({ deviationScore: 0.65 }))).toMatchObject({
      rawState: 'BAD',
      badReason: 'BASELINE_DEVIATION',
    })
  })

  it('does not confirm GOOD without calibration or a deviation score', () => {
    expect(fuse(tm(), media({ calibrationAvailable: false })).reasonCode).toBe('CALIBRATION_REQUIRED')
    expect(fuse(tm(), media({ deviationScore: null })).rawState).toBe('UNKNOWN')
  })
})
