import { describe, expect, it } from 'vitest'

import { PoseFeatureExtractor } from '@/ai/PoseFeatureExtractor'
import { createLandmarks, createPoseFrame } from '@/test/pose-fixtures'

describe('PoseFeatureExtractor', () => {
  const extractor = new PoseFeatureExtractor()

  it('extracts shoulder-normalized features', () => {
    const result = extractor.extract(createPoseFrame())
    expect(result?.shoulderWidth).toBeCloseTo(0.2)
    expect(result?.noseToShoulderVerticalRatio).toBeCloseTo(1.5)
    expect(result?.shoulderTiltRatio).toBeCloseTo(0)
    expect(result?.headHorizontalOffsetRatio).toBeCloseTo(0)
    expect(result?.faceScaleRatio).toBeCloseTo(0.6)
  })

  it('returns null when required landmarks are missing or unreliable', () => {
    const missingNose = createLandmarks()
    missingNose[0] = { ...missingNose[0], visibility: 0.1 }
    expect(extractor.extract(createPoseFrame(missingNose))).toBeNull()

    const missingShoulder = createLandmarks()
    missingShoulder[11] = { ...missingShoulder[11], presence: 0.1 }
    expect(extractor.extract(createPoseFrame(missingShoulder))).toBeNull()
  })

  it('uses null for an unavailable face scale and wrist', () => {
    const landmarks = createLandmarks()
    for (const index of [3, 6, 7, 8]) landmarks[index] = { ...landmarks[index], visibility: 0.1 }
    landmarks[15] = { ...landmarks[15], visibility: 0.1 }
    const result = extractor.extract(createPoseFrame(landmarks))
    expect(result?.faceScaleRatio).toBeNull()
    expect(result?.leftWristToFaceRatio).toBeNull()
  })

  it('rejects tiny shoulders and non-finite coordinates', () => {
    const tiny = createLandmarks()
    tiny[11] = { ...tiny[11], x: 0.49 }
    tiny[12] = { ...tiny[12], x: 0.51 }
    expect(extractor.extract(createPoseFrame(tiny))).toBeNull()

    const invalid = createLandmarks()
    invalid[0] = { ...invalid[0], x: Number.NaN }
    expect(extractor.extract(createPoseFrame(invalid))).toBeNull()
  })
})
