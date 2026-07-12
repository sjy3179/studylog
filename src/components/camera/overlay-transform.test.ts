import { describe, expect, it } from 'vitest'

import { computeContainTransform } from '@/components/camera/overlay-transform'

describe('computeContainTransform', () => {
  it('centers horizontal letterboxing', () => {
    expect(computeContainTransform(100, 100, 200, 100)).toEqual({
      scale: 1,
      offsetX: 50,
      offsetY: 0,
      renderedWidth: 100,
      renderedHeight: 100,
    })
  })

  it('centers vertical letterboxing', () => {
    expect(computeContainTransform(200, 100, 200, 200)).toEqual({
      scale: 1,
      offsetX: 0,
      offsetY: 50,
      renderedWidth: 200,
      renderedHeight: 100,
    })
  })

  it('fills containers with the same ratio', () => {
    expect(computeContainTransform(1280, 720, 640, 360)).toEqual({
      scale: 0.5,
      offsetX: 0,
      offsetY: 0,
      renderedWidth: 640,
      renderedHeight: 360,
    })
  })
})
