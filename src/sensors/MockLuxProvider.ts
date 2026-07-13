import {
  clampMockLux,
  getLuxStatus,
  type LuxProvider,
} from "@/sensors/LuxProvider";
import type { LuxStatus } from "@/types/study";

export class MockLuxProvider implements LuxProvider {
  private lux: number;

  constructor(initialLux = 620) {
    this.lux = clampMockLux(initialLux);
  }

  setLux(value: number): void {
    this.lux = clampMockLux(value);
  }

  getLux(): number {
    return this.lux;
  }

  getStatus(): LuxStatus {
    return getLuxStatus(this.lux);
  }
}
