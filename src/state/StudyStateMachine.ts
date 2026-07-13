import { resolveStudyStatus } from '@/runtime/StudyStatusResolver'
import type { StudyStateInput, StudyStatus } from "@/types/study";

/** Maps lifecycle, posture, and light into the single status shown to users. */
export function deriveStudyStatus(input: StudyStateInput): StudyStatus {
  return resolveStudyStatus(input)
}

export class StudyStateMachine {
  getStatus(input: StudyStateInput): StudyStatus {
    return deriveStudyStatus(input);
  }
}
