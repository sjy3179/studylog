import { describe, expect, it, vi } from 'vitest'

import { computeCenterSquareCrop, TmPoseInputAdapter } from '@/ai/tm-pose/TmPoseInputAdapter'

function setup(mirror: boolean) {
  const context = {
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    restore: vi.fn(),
    save: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
  }
  const canvas = {
    getContext: vi.fn().mockReturnValue(context),
    height: 0,
    width: 0,
  } as unknown as HTMLCanvasElement
  const adapter = new TmPoseInputAdapter(() => canvas)
  adapter.configure({ cropMode: 'CENTER_SQUARE', inputSize: 257, mirror })
  return { adapter, canvas, context }
}

function video(width: number, height: number): HTMLVideoElement {
  return { videoHeight: height, videoWidth: width } as HTMLVideoElement
}

describe('TmPoseInputAdapter', () => {
  it('calculates a centered crop for 16:9 video', () => {
    expect(computeCenterSquareCrop(1280, 720)).toEqual({ size: 720, sourceX: 280, sourceY: 0 })
  })

  it('calculates a centered crop for portrait video', () => {
    expect(computeCenterSquareCrop(720, 1280)).toEqual({ size: 720, sourceX: 0, sourceY: 280 })
  })

  it('keeps square video unchanged', () => {
    expect(computeCenterSquareCrop(600, 600)).toEqual({ size: 600, sourceX: 0, sourceY: 0 })
  })

  it('mirrors the inference canvas when enabled', () => {
    const { adapter, context } = setup(true)
    adapter.capture(video(1280, 720))
    expect(context.translate).toHaveBeenCalledWith(257, 0)
    expect(context.scale).toHaveBeenCalledWith(-1, 1)
  })

  it('does not mirror the inference canvas when disabled', () => {
    const { adapter, context } = setup(false)
    adapter.capture(video(1280, 720))
    expect(context.translate).not.toHaveBeenCalled()
    expect(context.scale).not.toHaveBeenCalled()
  })

  it('reuses one canvas instance', () => {
    const { adapter, canvas } = setup(false)
    expect(adapter.capture(video(640, 480))).toBe(canvas)
    expect(adapter.capture(video(640, 480))).toBe(canvas)
  })

  it('rejects video dimensions of zero', () => {
    const { adapter } = setup(false)
    expect(() => adapter.capture(video(0, 0))).toThrowError(
      expect.objectContaining({ code: 'INPUT_NOT_READY' }),
    )
  })
})
