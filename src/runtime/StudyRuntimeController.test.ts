import { describe, expect, it } from 'vitest'

import { StudyRuntimeController } from '@/runtime/StudyRuntimeController'
import type { MediaPipePostureSignal, TmPoseSignal } from '@/runtime/runtime-types'

const tm: TmPoseSignal = {
  timestampMs: 0,
  label: 'GOOD_POSTURE',
  confidence: 0.9,
  probabilities: { GOOD_POSTURE: 0.9, FORWARD_LEAN: 0.04, SIDE_LEAN: 0.03, RESTING: 0.03 },
  inferenceMs: 20,
  modelVersion: 'pilot-v2',
}
const media: MediaPipePostureSignal = {
  timestampMs: 0,
  poseDetected: true,
  deviationScore: 0.1,
  deviationReasons: [],
  inferenceMs: 10,
  calibrationAvailable: true,
}

function input(nowMs: number, overrides = {}) {
  return {
    nowMs,
    mode: 'AI' as const,
    lifecycle: 'RUNNING' as const,
    rawLux: 620,
    countLuxInEffectiveTime: true,
    mockPosture: 'BAD' as const,
    tmPrediction: { ...tm, timestampMs: nowMs },
    mediaPipeSignal: { ...media, timestampMs: nowMs },
    cameraReady: true,
    cameraError: false,
    mediaPipeReady: true,
    mediaPipeError: false,
    tmReady: true,
    tmError: false,
    ...overrides,
  }
}

describe('StudyRuntimeController', () => {
  it('keeps Mock and AI inputs isolated', () => {
    const controller = new StudyRuntimeController()
    const mock = controller.tick(input(0, { mode: 'MOCK' as const, mockPosture: 'BAD' as const }))
    expect(mock.snapshot.timerPosture).toBe('BAD')
    expect(mock.snapshot.fusedObservation).toBeNull()

    const ai = controller.tick(input(100))
    expect(ai.snapshot.timerPosture).toBe('UNKNOWN')
    expect(ai.snapshot.stablePosture.history).toHaveLength(1)
  })

  it('does not use AI GOOD when camera readiness or freshness is missing', () => {
    const controller = new StudyRuntimeController()
    expect(controller.tick(input(0, { cameraReady: false })).snapshot).toMatchObject({
      blockingReason: 'CAMERA_NOT_READY',
      timerPosture: 'UNKNOWN',
    })
    expect(controller.tick(input(2_000, {
      tmPrediction: { ...tm, timestampMs: 0 },
      mediaPipeSignal: { ...media, timestampMs: 2_000 },
    })).snapshot.timerPosture).toBe('UNKNOWN')
  })

  it('resets AI history when switching modes', () => {
    const controller = new StudyRuntimeController()
    controller.tick(input(0))
    controller.tick(input(100, { mode: 'MOCK' as const }))
    const ai = controller.tick(input(200))
    expect(ai.snapshot.stablePosture.history).toHaveLength(1)
  })
})
