import { describe, expect, it } from "vitest";

import { deriveStudyStatus } from "@/state/StudyStateMachine";
import type { StudyStateInput } from "@/types/study";

function input(overrides: Partial<StudyStateInput> = {}): StudyStateInput {
  return {
    lifecycle: "RUNNING",
    posture: "GOOD",
    luxStatus: "RECOMMENDED",
    ...overrides,
  };
}

describe("deriveStudyStatus", () => {
  it("maps the four posture and lux combinations", () => {
    expect(deriveStudyStatus(input())).toBe("STUDYING");
    expect(deriveStudyStatus(input({ posture: "BAD" }))).toBe(
      "POSTURE_CAUTION",
    );
    expect(deriveStudyStatus(input({ luxStatus: "DARK" }))).toBe(
      "LUX_CAUTION",
    );
    expect(
      deriveStudyStatus(input({ posture: "BAD", luxStatus: "TOO_BRIGHT" })),
    ).toBe("MULTI_CAUTION");
  });

  it("lets AWAY override the light condition", () => {
    expect(
      deriveStudyStatus(input({ posture: "AWAY", luxStatus: "DARK" })),
    ).toBe("AWAY");
  });

  it("returns CHECKING for unknown posture and setup lifecycles", () => {
    expect(deriveStudyStatus(input({ posture: "UNKNOWN" }))).toBe("CHECKING");
    expect(
      deriveStudyStatus(input({ lifecycle: "INITIALIZING", posture: "AWAY" })),
    ).toBe("CHECKING");
    expect(deriveStudyStatus(input({ lifecycle: "CALIBRATING" }))).toBe(
      "CHECKING",
    );
  });

  it("lets PAUSED override posture and light warnings", () => {
    expect(
      deriveStudyStatus(
        input({
          lifecycle: "PAUSED",
          posture: "BAD",
          luxStatus: "DARK",
        }),
      ),
    ).toBe("PAUSED");
  });

  it.each(["IDLE", "FINISHED", "ERROR"] as const)(
    "represents %s as a non-running PAUSED display state",
    (lifecycle) => {
      expect(deriveStudyStatus(input({ lifecycle }))).toBe("PAUSED");
    },
  );
});
