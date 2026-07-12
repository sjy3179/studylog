export interface SignalReceiptState {
  sourceTimestampMs: number | null
  receivedAtMs: number | null
}

export function recordSignalReceipt(
  state: SignalReceiptState,
  sourceTimestampMs: number | null,
  nowMs: number,
): SignalReceiptState {
  if (sourceTimestampMs === null) return { sourceTimestampMs: null, receivedAtMs: null }
  if (state.sourceTimestampMs === sourceTimestampMs) return state
  return { sourceTimestampMs, receivedAtMs: nowMs }
}
