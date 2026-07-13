import { describe, expect, it } from 'vitest'

import { LuxStateMachine } from '@/runtime/LuxStateMachine'

describe('LuxStateMachine', () => {
  it.each([
    [200, 'DARK'],
    [400, 'DIM'],
    [620, 'RECOMMENDED'],
    [800, 'BRIGHT'],
    [1_200, 'TOO_BRIGHT'],
  ] as const)('classifies %s Lux as %s', (lux, status) => {
    expect(new LuxStateMachine().update(lux, 0).status).toBe(status)
  })

  it('requires a new state for three seconds', () => {
    const machine = new LuxStateMachine()
    machine.update(620, 0)
    expect(machine.update(200, 1).status).toBe('RECOMMENDED')
    expect(machine.update(200, 3_000).status).toBe('RECOMMENDED')
    expect(machine.update(200, 3_001).status).toBe('DARK')
  })

  it('applies 20 Lux hysteresis around the recommended lower boundary', () => {
    const machine = new LuxStateMachine()
    machine.update(620, 0)
    expect(machine.update(490, 100).isTransitioning).toBe(false)
    expect(machine.update(479, 200).candidateStatus).toBe('DIM')
  })

  it('rejects invalid lux and threshold configuration', () => {
    const machine = new LuxStateMachine()
    expect(() => machine.update(Number.NaN, 0)).toThrow(RangeError)
    expect(() => machine.update(-1, 0)).toThrow(RangeError)
    expect(() => machine.setConfig({ darkMax: 500, dimMax: 300, recommendedMax: 700, brightMax: 1_000, holdMs: 3_000, hysteresisLux: 20 }, 0)).toThrow(RangeError)
  })
})
