import { describe, expect, it } from 'vitest'

import { median, medianAbsoluteDeviation } from '@/ai/pose-statistics'

describe('pose statistics', () => {
  it('computes odd and even medians', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([4, 1, 3, 2])).toBe(2.5)
  })

  it('rejects an empty median', () => {
    expect(() => median([])).toThrow(RangeError)
  })

  it('computes median absolute deviation', () => {
    expect(medianAbsoluteDeviation([1, 1, 2, 2, 4, 6, 9])).toBe(1)
  })
})
