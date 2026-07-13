export function median(values: number[]): number {
  if (values.length === 0) {
    throw new RangeError('median requires at least one value.')
  }

  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle]
}

export function medianAbsoluteDeviation(values: number[]): number {
  const center = median(values)
  return median(values.map((value) => Math.abs(value - center)))
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}
