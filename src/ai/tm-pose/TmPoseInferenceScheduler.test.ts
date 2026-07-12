import { afterEach, describe, expect, it, vi } from 'vitest'

import { BrowserAiInferenceCoordinator } from '@/ai/BrowserAiInferenceCoordinator'
import { TmPoseInferenceScheduler } from '@/ai/tm-pose/TmPoseInferenceScheduler'
import type { TmPosePredictionResult } from '@/ai/tm-pose/tm-pose-types'

function result(inferenceMs = 20): TmPosePredictionResult {
  return {
    available: true,
    confidence: 0.8,
    inferenceMs,
    modelVersion: 'pilot-v1',
    poseScore: 0.9,
    probabilities: {
      FORWARD_LEAN: 0.1,
      GOOD_POSTURE: 0.8,
      RESTING: 0.05,
      SIDE_LEAN: 0.05,
    },
    runtimeStrategy: 'NPM_ESM',
    sortedProbabilities: [],
    timestampMs: 0,
    topLabel: 'GOOD_POSTURE',
  }
}

function setup(overrides: { canRun?: boolean; hidden?: boolean; inferenceMs?: number } = {}) {
  let callback: FrameRequestCallback | null = null
  let videoTime = 1
  const predict = vi.fn().mockImplementation(async () => result(overrides.inferenceMs))
  const onPrediction = vi.fn()
  const scheduler = new TmPoseInferenceScheduler({
    cancelFrame: vi.fn(),
    canRun: () => overrides.canRun ?? true,
    coordinator: new BrowserAiInferenceCoordinator(),
    getVideoTime: () => videoTime,
    isHidden: () => overrides.hidden ?? false,
    onError: vi.fn(),
    onPrediction,
    predict,
    requestFrame: (next) => {
      callback = next
      return 1
    },
  })
  const tick = async (now: number, nextVideoTime = videoTime) => {
    videoTime = nextVideoTime
    const current = callback
    if (current) current(now)
    await Promise.resolve()
    await Promise.resolve()
  }
  return { onPrediction, predict, scheduler, tick }
}

describe('TmPoseInferenceScheduler', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('invokes browser animation frame APIs with the window receiver', () => {
    const requestFrame = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation(function (this: Window) {
        expect(this).toBe(window)
        return 23
      })
    const cancelFrame = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(function (this: Window) {
        expect(this).toBe(window)
      })
    const scheduler = new TmPoseInferenceScheduler({
      canRun: () => true,
      getVideoTime: () => 1,
      onError: vi.fn(),
      onPrediction: vi.fn(),
      predict: vi.fn().mockResolvedValue(result()),
    })

    scheduler.start()
    scheduler.stop()

    expect(requestFrame).toHaveBeenCalledTimes(1)
    expect(cancelFrame).toHaveBeenCalledWith(23)
  })

  it('waits for the initial offset before predicting', async () => {
    const { predict, scheduler, tick } = setup()
    scheduler.start()
    await tick(0)
    await tick(69, 2)
    expect(predict).not.toHaveBeenCalled()
    await tick(70, 3)
    expect(predict).toHaveBeenCalledTimes(1)
  })

  it('does not create duplicate loops when started twice', () => {
    let requests = 0
    const scheduler = new TmPoseInferenceScheduler({
      canRun: () => true,
      getVideoTime: () => 1,
      onError: vi.fn(),
      onPrediction: vi.fn(),
      predict: vi.fn().mockResolvedValue(result()),
      requestFrame: () => ++requests,
    })
    scheduler.start()
    scheduler.start()
    expect(requests).toBe(1)
    scheduler.stop()
  })

  it('pauses in a hidden tab', async () => {
    const { predict, scheduler, tick } = setup({ hidden: true })
    scheduler.start()
    await tick(0)
    await tick(100, 2)
    expect(predict).not.toHaveBeenCalled()
  })

  it('pauses when the camera cannot run', async () => {
    const { predict, scheduler, tick } = setup({ canRun: false })
    scheduler.start()
    await tick(0)
    await tick(100, 2)
    expect(predict).not.toHaveBeenCalled()
  })

  it('stops its loop during cleanup', () => {
    const { scheduler } = setup()
    scheduler.start()
    scheduler.stop()
    expect(scheduler.getMetrics().running).toBe(false)
  })

  it('relaxes to 1000ms after slow inference', async () => {
    const { scheduler, tick } = setup({ inferenceMs: 500 })
    scheduler.start()
    await tick(0)
    await tick(70, 2)
    expect(scheduler.getMetrics().currentIntervalMs).toBe(1_000)
  })
})
