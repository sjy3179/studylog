import type { LuxStatus } from "@/types/study";

export const MIN_MOCK_LUX = 0;
export const MAX_MOCK_LUX = 1_500;

export interface LuxProvider {
  getLux(): number;
}

export function getLuxStatus(lux: number): LuxStatus {
  if (!Number.isFinite(lux)) {
    throw new TypeError("Lux must be a finite number.");
  }

  if (lux < 300) {
    return "DARK";
  }

  if (lux < 500) {
    return "DIM";
  }

  if (lux <= 700) {
    return "RECOMMENDED";
  }

  if (lux <= 1_000) {
    return "BRIGHT";
  }

  return "TOO_BRIGHT";
}

export function clampMockLux(lux: number): number {
  if (!Number.isFinite(lux)) {
    throw new TypeError("Lux must be a finite number.");
  }

  return Math.min(MAX_MOCK_LUX, Math.max(MIN_MOCK_LUX, lux));
}
