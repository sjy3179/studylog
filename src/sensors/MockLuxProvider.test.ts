import { describe, expect, it } from "vitest";

import { MockLuxProvider } from "@/sensors/MockLuxProvider";
import { getLuxStatus } from "@/sensors/LuxProvider";

describe("getLuxStatus", () => {
  it.each([
    [0, "DARK"],
    [299, "DARK"],
    [300, "DIM"],
    [499, "DIM"],
    [500, "RECOMMENDED"],
    [700, "RECOMMENDED"],
    [701, "BRIGHT"],
    [1_000, "BRIGHT"],
    [1_001, "TOO_BRIGHT"],
    [1_500, "TOO_BRIGHT"],
  ] as const)("maps %i Lux to %s", (lux, expected) => {
    expect(getLuxStatus(lux)).toBe(expected);
  });

  it("rejects non-finite readings", () => {
    expect(() => getLuxStatus(Number.NaN)).toThrow(TypeError);
    expect(() => getLuxStatus(Number.POSITIVE_INFINITY)).toThrow(TypeError);
  });
});

describe("MockLuxProvider", () => {
  it("starts at the recommended 620 Lux preset", () => {
    const provider = new MockLuxProvider();

    expect(provider.getLux()).toBe(620);
    expect(provider.getStatus()).toBe("RECOMMENDED");
  });

  it.each([
    [200, "DARK"],
    [620, "RECOMMENDED"],
    [1_200, "TOO_BRIGHT"],
  ] as const)("simulates the %i Lux preset", (lux, expected) => {
    const provider = new MockLuxProvider();

    provider.setLux(lux);

    expect(provider.getLux()).toBe(lux);
    expect(provider.getStatus()).toBe(expected);
  });

  it("keeps mock readings within the 0 to 1500 Lux control range", () => {
    const provider = new MockLuxProvider(-100);
    expect(provider.getLux()).toBe(0);

    provider.setLux(2_000);
    expect(provider.getLux()).toBe(1_500);
  });
});
