import { describe, expect, it } from "vitest";

import { SessionTimer } from "@/session/SessionTimer";
import type { SessionTimerSample } from "@/types/study";

function sample(
  overrides: Partial<SessionTimerSample> = {},
): SessionTimerSample {
  return {
    lifecycle: "RUNNING",
    posture: "GOOD",
    luxStatus: "RECOMMENDED",
    countLuxInEffectiveTime: true,
    ...overrides,
  };
}

describe("SessionTimer", () => {
  it("uses monotonic timestamp deltas rather than tick counts", () => {
    const timer = new SessionTimer();

    timer.tick(10_000, sample());
    timer.tick(10_125, sample());
    const durations = timer.tick(10_900, sample());

    expect(durations.totalSessionMs).toBe(900);
    expect(durations.effectiveStudyMs).toBe(900);
    expect(durations.seatedMs).toBe(900);
  });

  it("records BAD time as seated posture caution", () => {
    const timer = new SessionTimer();

    const durations = timer.advanceBy(750, sample({ posture: "BAD" }));

    expect(durations).toMatchObject({
      totalSessionMs: 750,
      effectiveStudyMs: 0,
      seatedMs: 750,
      postureCautionMs: 750,
      awayMs: 0,
      luxCautionMs: 0,
    });
  });

  it("records AWAY in total time but not seated or effective time", () => {
    const timer = new SessionTimer();

    const durations = timer.advanceBy(500, sample({ posture: "AWAY" }));

    expect(durations).toMatchObject({
      totalSessionMs: 500,
      effectiveStudyMs: 0,
      seatedMs: 0,
      awayMs: 500,
    });
  });

  it("records UNKNOWN as checking without treating it as seated", () => {
    const timer = new SessionTimer();

    const durations = timer.advanceBy(500, sample({ posture: "UNKNOWN" }));

    expect(durations).toMatchObject({
      totalSessionMs: 500,
      seatedMs: 0,
      checkingMs: 500,
      effectiveStudyMs: 0,
    });
  });

  it("clamps a single monotonic tick delta to two seconds", () => {
    const timer = new SessionTimer();
    timer.tick(0, sample());

    expect(timer.tick(10_000, sample()).totalSessionMs).toBe(2_000);
  });

  it("records overlapping posture and lux caution details", () => {
    const timer = new SessionTimer();

    const durations = timer.advanceBy(
      1_000,
      sample({ posture: "BAD", luxStatus: "DIM" }),
    );

    expect(durations).toMatchObject({
      totalSessionMs: 1_000,
      seatedMs: 1_000,
      postureCautionMs: 1_000,
      luxCautionMs: 1_000,
    });
  });

  it("keeps lux warning statistics when lux is excluded from effective time", () => {
    const timer = new SessionTimer();

    const durations = timer.advanceBy(
      800,
      sample({ luxStatus: "DARK", countLuxInEffectiveTime: false }),
    );

    expect(durations.effectiveStudyMs).toBe(800);
    expect(durations.luxCautionMs).toBe(800);
  });

  it("stops effective time when lux is required but not recommended", () => {
    const timer = new SessionTimer();

    const durations = timer.advanceBy(
      800,
      sample({ luxStatus: "TOO_BRIGHT", countLuxInEffectiveTime: true }),
    );

    expect(durations.totalSessionMs).toBe(800);
    expect(durations.effectiveStudyMs).toBe(0);
    expect(durations.luxCautionMs).toBe(800);
  });

  it("stops every duration while manually paused", () => {
    const timer = new SessionTimer();

    timer.advanceBy(400, sample());
    const durations = timer.advanceBy(
      1_000,
      sample({ lifecycle: "PAUSED", posture: "BAD", luxStatus: "DARK" }),
    );

    expect(durations).toMatchObject({
      totalSessionMs: 400,
      effectiveStudyMs: 400,
      seatedMs: 400,
      postureCautionMs: 0,
      awayMs: 0,
      luxCautionMs: 0,
    });
  });

  it("returns snapshots that cannot mutate the timer's internal totals", () => {
    const timer = new SessionTimer();
    const first = timer.advanceBy(250, sample());

    (first as { totalSessionMs: number }).totalSessionMs = 99_999;

    expect(timer.getDurations().totalSessionMs).toBe(250);
  });

  it("rejects negative deltas and a clock that moves backwards", () => {
    const timer = new SessionTimer();

    expect(() => timer.advanceBy(-1, sample())).toThrow(RangeError);
    timer.tick(100, sample());
    expect(() => timer.tick(99, sample())).toThrow(RangeError);
  });
});
