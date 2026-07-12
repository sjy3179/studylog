import { describe, expect, it } from 'vitest'

import { CalibrationManager } from '@/ai/CalibrationManager'
import { createFeatures } from '@/test/pose-fixtures'

function createHarness() {
  let now = 0
  const manager = new CalibrationManager(() => now)
  return {
    manager,
    setNow(value: number) {
      now = value
    },
  }
}

describe('CalibrationManager', () => {
  it('moves through countdown, collection, processing, and calibration', () => {
    const harness = createHarness()
    harness.manager.markReady()
    harness.manager.start()
    expect(harness.manager.getStatus()).toBe('COUNTDOWN')
    expect(harness.manager.getCountdownSeconds()).toBe(3)

    harness.setNow(3_000)
    expect(harness.manager.update()).toBe('COLLECTING')
    for (let index = 0; index < 15; index += 1) {
      harness.manager.addSample(createFeatures({ shoulderTiltRatio: 0.05 + index * 0.0001 }), 3_000 + index * 100)
    }
    harness.setNow(5_500)
    expect(harness.manager.update()).toBe('PROCESSING')

    const profile = harness.manager.finish({ cameraDeviceId: 'camera-a', createdAt: '2026-07-12T00:00:00.000Z' })
    expect(profile.sampleCount).toBe(15)
    expect(profile.baseline.noseToShoulderVerticalRatio).toBe(1.5)
    expect(profile.cameraDeviceId).toBe('camera-a')
    expect(harness.manager.getStatus()).toBe('CALIBRATED')
  })

  it('fails when there are too few valid samples', () => {
    const harness = createHarness()
    harness.manager.markReady()
    harness.manager.start()
    harness.setNow(3_000)
    harness.manager.update()
    for (let index = 0; index < 5; index += 1) harness.manager.addSample(createFeatures(), 3_100 + index)
    harness.setNow(5_500)
    harness.manager.update()

    expect(() => harness.manager.finish({ cameraDeviceId: null })).toThrow('12개보다 적습니다')
    expect(harness.manager.getStatus()).toBe('FAILED')
  })

  it('fails a profile with a low valid sample ratio', () => {
    const harness = createHarness()
    harness.manager.markReady()
    harness.manager.start()
    harness.setNow(3_000)
    harness.manager.update()
    for (let index = 0; index < 12; index += 1) harness.manager.recordObservation(createFeatures(), 3_100 + index)
    for (let index = 0; index < 12; index += 1) harness.manager.recordObservation(null, 3_200 + index)
    harness.setNow(5_500)
    harness.manager.update()

    expect(() => harness.manager.finish({ cameraDeviceId: null })).toThrow('유효한 자세 샘플 비율')
    expect(harness.manager.getQuality()?.acceptable).toBe(false)
  })

  it('supports cancel and reset', () => {
    const harness = createHarness()
    harness.manager.markReady()
    harness.manager.start()
    harness.manager.cancel()
    expect(harness.manager.getStatus()).toBe('CANCELLED')
    harness.manager.reset()
    expect(harness.manager.getStatus()).toBe('NOT_CALIBRATED')
    expect(harness.manager.getSampleCount()).toBe(0)
  })
})
