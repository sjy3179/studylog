import {
  EMPTY_SESSION_DURATIONS,
  type SessionDurations,
  type SessionTimerSample,
} from "@/types/study";

function copyDurations(durations: Readonly<SessionDurations>): SessionDurations {
  return { ...durations };
}

function assertNonNegativeFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative finite number.`);
  }
}

/**
 * Delta-based session timer. Call tick with a monotonic timestamp, or advanceBy
 * directly when the caller already computed the elapsed duration.
 */
export class SessionTimer {
  private durations: SessionDurations = copyDurations(EMPTY_SESSION_DURATIONS);
  private lastNowMs: number | null = null;

  tick(nowMs: number, sample: SessionTimerSample): Readonly<SessionDurations> {
    assertNonNegativeFinite(nowMs, "nowMs");

    if (this.lastNowMs === null) {
      this.lastNowMs = nowMs;
      return this.getDurations();
    }

    if (nowMs < this.lastNowMs) {
      throw new RangeError("nowMs must be monotonic.");
    }

    const deltaMs = nowMs - this.lastNowMs;
    this.lastNowMs = nowMs;
    return this.advanceBy(deltaMs, sample);
  }

  advanceBy(
    deltaMs: number,
    sample: SessionTimerSample,
  ): Readonly<SessionDurations> {
    assertNonNegativeFinite(deltaMs, "deltaMs");

    if (deltaMs === 0 || sample.lifecycle !== "RUNNING") {
      return this.getDurations();
    }

    this.durations.totalSessionMs += deltaMs;

    const isSeated = sample.posture !== "AWAY";
    if (!isSeated) {
      this.durations.awayMs += deltaMs;
      return this.getDurations();
    }

    this.durations.seatedMs += deltaMs;

    const hasRecommendedLux = sample.luxStatus === "RECOMMENDED";
    if (!hasRecommendedLux) {
      this.durations.luxCautionMs += deltaMs;
    }

    if (sample.posture === "BAD") {
      this.durations.postureCautionMs += deltaMs;
    }

    const satisfiesLuxRule =
      !sample.countLuxInEffectiveTime || hasRecommendedLux;
    if (sample.posture === "GOOD" && satisfiesLuxRule) {
      this.durations.effectiveStudyMs += deltaMs;
    }

    return this.getDurations();
  }

  getDurations(): Readonly<SessionDurations> {
    return copyDurations(this.durations);
  }

  reset(nowMs: number | null = null): Readonly<SessionDurations> {
    if (nowMs !== null) {
      assertNonNegativeFinite(nowMs, "nowMs");
    }

    this.durations = copyDurations(EMPTY_SESSION_DURATIONS);
    this.lastNowMs = nowMs;
    return this.getDurations();
  }
}
