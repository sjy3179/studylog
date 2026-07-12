import { describe, expect, it } from 'vitest'

import { PostureDeviationAnalyzer } from '@/ai/PostureDeviationAnalyzer'
import type { CalibrationProfile } from '@/ai/pose-types'
import { createFeatures } from '@/test/pose-fixtures'

const profile: CalibrationProfile = {
  id: 'profile',
  version: 1,
  createdAt: '2026-07-12T00:00:00.000Z',
  cameraDeviceId: null,
  sampleCount: 15,
  baseline: {
    noseToShoulderVerticalRatio: 1.5,
    shoulderTiltRatio: 0.05,
    headHorizontalOffsetRatio: 0.05,
    faceScaleRatio: 0.6,
  },
  quality: { validSampleRatio: 1, movementScore: 0.02 },
}

describe('PostureDeviationAnalyzer', () => {
  const analyzer = new PostureDeviationAnalyzer()

  it('returns a low score for the baseline posture', () => {
    const result = analyzer.analyze(createFeatures(), profile)
    expect(result.score).toBe(0)
    expect(result.level).toBe('LOW')
    expect(result.reasons).toEqual([])
  })

  it.each([
    [createFeatures({ noseToShoulderVerticalRatio: 1.2 }), 'HEAD_DROPPED'],
    [createFeatures({ shoulderTiltRatio: 0.2 }), 'SHOULDER_TILTED'],
    [createFeatures({ faceScaleRatio: 0.8 }), 'FACE_MOVED_CLOSER'],
    [createFeatures({ headHorizontalOffsetRatio: 0.3 }), 'BODY_SHIFTED'],
  ] as const)('detects a relative deviation', (features, reason) => {
    expect(analyzer.analyze(features, profile).reasons).toContain(reason)
  })

  it('handles null face scale and clamps score to 0..1', () => {
    const result = analyzer.analyze(
      createFeatures({
        faceScaleRatio: null,
        noseToShoulderVerticalRatio: -10,
        shoulderTiltRatio: 10,
        headHorizontalOffsetRatio: 10,
      }),
      profile,
    )
    expect(result.metrics.faceScaleDelta).toBeNull()
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(1)
  })
})
