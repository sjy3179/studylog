import { describe, expect, it } from 'vitest'

import { PostureStateMachine } from '@/runtime/PostureStateMachine'
import type { BadPostureReason, FusedPostureObservation, RawPostureState } from '@/runtime/runtime-types'

function observation(timestampMs: number, rawState: RawPostureState, badReason: BadPostureReason | null = null): FusedPostureObservation {
  return {
    timestampMs,
    rawState,
    badReason,
    tmLabel: rawState === 'GOOD' ? 'GOOD_POSTURE' : badReason === 'BASELINE_DEVIATION' ? 'GOOD_POSTURE' : badReason,
    tmConfidence: 0.9,
    tmFresh: true,
    poseDetected: rawState !== 'NO_POSE',
    mediaPipeFresh: true,
    deviationScore: 0.1,
    deviationReasons: [],
    reasonCode: rawState === 'NO_POSE' ? 'NO_POSE' : 'UNKNOWN',
  }
}

function feed(machine: PostureStateMachine, state: RawPostureState, count: number, start = 0, reason: BadPostureReason | null = null) {
  let snapshot = machine.getSnapshot(start)
  for (let index = 0; index < count; index += 1) {
    const now = start + index * 100
    snapshot = machine.update(observation(now, state, reason), now)
  }
  return snapshot
}

describe('PostureStateMachine', () => {
  it('requires 8 of 12 observations for a candidate', () => {
    const machine = new PostureStateMachine()
    expect(feed(machine, 'GOOD', 7).candidateState).toBeNull()
    expect(machine.update(observation(700, 'GOOD'), 700).candidateState).toBe('GOOD')
  })

  it('requires the full GOOD and BAD hold durations', () => {
    const good = new PostureStateMachine()
    feed(good, 'GOOD', 8)
    expect(good.update(observation(2_199, 'GOOD'), 2_199).state).toBe('UNKNOWN')
    expect(good.update(observation(2_200, 'GOOD'), 2_200).state).toBe('GOOD')
    expect(good.update(observation(2_300, 'GOOD'), 2_300).isTransitioning).toBe(false)

    const bad = new PostureStateMachine()
    feed(bad, 'BAD', 8, 0, 'FORWARD_LEAN')
    expect(bad.update(observation(3_699, 'BAD', 'FORWARD_LEAN'), 3_699).state).toBe('UNKNOWN')
    expect(bad.update(observation(3_700, 'BAD', 'FORWARD_LEAN'), 3_700)).toMatchObject({
      state: 'BAD',
      badReason: 'FORWARD_LEAN',
    })
  })

  it('selects the most frequent recent BAD reason and favors the recent reason on ties', () => {
    const machine = new PostureStateMachine()
    const reasons = ['SIDE_LEAN', 'FORWARD_LEAN', 'SIDE_LEAN', 'FORWARD_LEAN', 'SIDE_LEAN', 'FORWARD_LEAN', 'SIDE_LEAN', 'FORWARD_LEAN'] as const
    reasons.forEach((reason, index) => machine.update(observation(index * 100, 'BAD', reason), index * 100))
    expect(machine.update(observation(3_700, 'BAD', 'FORWARD_LEAN'), 3_700).badReason).toBe('FORWARD_LEAN')
  })

  it('requires 2.5 seconds of continuous NO_POSE for AWAY', () => {
    const machine = new PostureStateMachine()
    expect(machine.update(observation(0, 'NO_POSE'), 0).state).not.toBe('AWAY')
    expect(machine.update(observation(2_499, 'NO_POSE'), 2_499).state).not.toBe('AWAY')
    expect(machine.update(observation(2_500, 'NO_POSE'), 2_500).state).toBe('AWAY')
  })

  it('protects the previous state during UNKNOWN grace then enters UNKNOWN', () => {
    const machine = new PostureStateMachine()
    feed(machine, 'GOOD', 8)
    machine.update(observation(2_200, 'GOOD'), 2_200)
    expect(machine.update(observation(2_300, 'UNKNOWN'), 2_300).state).toBe('GOOD')
    expect(machine.update(observation(4_300, 'UNKNOWN'), 4_300).state).toBe('GOOD')
    expect(machine.update(observation(4_301, 'UNKNOWN'), 4_301).state).toBe('UNKNOWN')
  })

  it('does not restore GOOD immediately after AWAY', () => {
    const machine = new PostureStateMachine()
    machine.update(observation(0, 'NO_POSE'), 0)
    machine.update(observation(2_500, 'NO_POSE'), 2_500)
    expect(machine.update(observation(2_600, 'GOOD'), 2_600).state).toBe('AWAY')
  })

  it('ignores duplicate and regressing timestamps and clears history on reset', () => {
    const machine = new PostureStateMachine()
    machine.update(observation(100, 'GOOD'), 100)
    machine.update(observation(100, 'GOOD'), 100)
    expect(machine.getSnapshot(100).history).toHaveLength(1)
    expect(machine.update(observation(90, 'BAD', 'RESTING'), 90).history).toHaveLength(1)
    machine.reset(200)
    expect(machine.getSnapshot(200).history).toHaveLength(0)
  })
})
