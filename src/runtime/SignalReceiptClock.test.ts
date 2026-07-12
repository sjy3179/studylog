import { describe, expect, it } from 'vitest'

import { recordSignalReceipt } from '@/runtime/SignalReceiptClock'

describe('recordSignalReceipt', () => {
  it('timestamps a newly received inference result with the runtime clock', () => {
    expect(recordSignalReceipt({ sourceTimestampMs: null, receivedAtMs: null }, 50, 1_000)).toEqual({
      sourceTimestampMs: 50,
      receivedAtMs: 1_000,
    })
  })

  it('does not refresh an unchanged inference result', () => {
    const current = { sourceTimestampMs: 50, receivedAtMs: 1_000 }
    expect(recordSignalReceipt(current, 50, 1_500)).toBe(current)
  })

  it('clears receipt state when the source disappears', () => {
    expect(recordSignalReceipt({ sourceTimestampMs: 50, receivedAtMs: 1_000 }, null, 1_500)).toEqual({
      sourceTimestampMs: null,
      receivedAtMs: null,
    })
  })
})
