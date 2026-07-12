import type { StudyStateInput, StudyStatus } from "@/types/study";

const CHECKING_LIFECYCLES = new Set(["INITIALIZING", "CALIBRATING"]);

/** Maps lifecycle, posture, and light into the single status shown to users. */
export function deriveStudyStatus(input: StudyStateInput): StudyStatus {
  if (input.lifecycle === "PAUSED") {
    return "PAUSED";
  }

  if (CHECKING_LIFECYCLES.has(input.lifecycle)) {
    return "CHECKING";
  }

  if (input.lifecycle !== "RUNNING") {
    return "PAUSED";
  }

  if (input.posture === "AWAY") {
    return "AWAY";
  }

  if (input.posture === "UNKNOWN") {
    return "CHECKING";
  }

  const hasPostureCaution = input.posture === "BAD";
  const hasLuxCaution = input.luxStatus !== "RECOMMENDED";

  if (hasPostureCaution && hasLuxCaution) {
    return "MULTI_CAUTION";
  }

  if (hasPostureCaution) {
    return "POSTURE_CAUTION";
  }

  if (hasLuxCaution) {
    return "LUX_CAUTION";
  }

  return "STUDYING";
}

export class StudyStateMachine {
  getStatus(input: StudyStateInput): StudyStatus {
    return deriveStudyStatus(input);
  }
}
