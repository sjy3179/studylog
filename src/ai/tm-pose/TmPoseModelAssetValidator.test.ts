import { describe, expect, it } from 'vitest'

import { TmPoseError } from '@/ai/tm-pose/tm-pose-errors'
import { TmPoseModelAssetValidator } from '@/ai/tm-pose/TmPoseModelAssetValidator'
import { TM_POSE_LABELS } from '@/types/study'

const validator = new TmPoseModelAssetValidator()

function metadata(labels: unknown = [...TM_POSE_LABELS], inputResolution: unknown = 257) {
  return {
    labels,
    modelSettings: { posenet: { inputResolution } },
    modelName: 'pilot',
  }
}

describe('TmPoseModelAssetValidator', () => {
  it('accepts the exact four labels', () => {
    expect(validator.validateMetadata(metadata()).labels).toEqual(TM_POSE_LABELS)
  })

  it('rejects a missing label', () => {
    expect(() => validator.validateMetadata(metadata(TM_POSE_LABELS.slice(0, 3)))).toThrow(TmPoseError)
  })

  it('rejects an additional label', () => {
    expect(() => validator.validateMetadata(metadata([...TM_POSE_LABELS, 'AWAY']))).toThrowError(
      expect.objectContaining({ code: 'LABEL_COUNT_MISMATCH' }),
    )
  })

  it('rejects duplicate labels', () => {
    expect(() =>
      validator.validateMetadata(metadata(['GOOD_POSTURE', 'FORWARD_LEAN', 'SIDE_LEAN', 'SIDE_LEAN'])),
    ).toThrowError(expect.objectContaining({ code: 'METADATA_INVALID' }))
  })

  it('rejects a non-array labels value', () => {
    expect(() => validator.validateMetadata(metadata('GOOD_POSTURE'))).toThrowError(
      expect.objectContaining({ code: 'METADATA_INVALID' }),
    )
  })

  it('normalizes a different class order by class name', () => {
    const labels = [...TM_POSE_LABELS].reverse()
    expect(validator.validateModelLabels(labels)).toEqual(TM_POSE_LABELS)
  })

  it('uses 257 when inputResolution is invalid', () => {
    expect(validator.resolveInputResolution(validator.validateMetadata(metadata(TM_POSE_LABELS, 'bad')))).toBe(257)
  })
})
