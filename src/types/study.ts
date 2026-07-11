export const TM_POSE_LABELS = [
  "GOOD_POSTURE",
  "FORWARD_LEAN",
  "SIDE_LEAN",
  "RESTING",
] as const;

export type TmPoseLabel = (typeof TM_POSE_LABELS)[number];

export type SessionLifecycle =
  | "IDLE"
  | "INITIALIZING"
  | "CALIBRATING"
  | "RUNNING"
  | "PAUSED"
  | "FINISHED"
  | "ERROR";

export type RawPostureState =
  | "GOOD"
  | "FORWARD"
  | "SIDE"
  | "RESTING"
  | "NO_POSE"
  | "UNKNOWN";

export type StablePostureState = "GOOD" | "BAD" | "AWAY" | "UNKNOWN";

export type MockPostureState = Exclude<StablePostureState, "UNKNOWN">;

export type LuxStatus =
  | "DARK"
  | "DIM"
  | "RECOMMENDED"
  | "BRIGHT"
  | "TOO_BRIGHT";

export type StudyStatus =
  | "STUDYING"
  | "POSTURE_CAUTION"
  | "LUX_CAUTION"
  | "MULTI_CAUTION"
  | "AWAY"
  | "CHECKING"
  | "PAUSED";

export interface StudyStateInput {
  lifecycle: SessionLifecycle;
  posture: StablePostureState;
  luxStatus: LuxStatus;
}

export interface SessionTimerSample extends StudyStateInput {
  countLuxInEffectiveTime: boolean;
}

export interface SessionDurations {
  totalSessionMs: number;
  effectiveStudyMs: number;
  seatedMs: number;
  postureCautionMs: number;
  awayMs: number;
  luxCautionMs: number;
}

export interface TimerVisibilitySettings {
  showEffectiveStudyTime: true;
  showTotalSessionTime: boolean;
  showPostureCautionTime: boolean;
  showAwayTime: boolean;
  showLuxCautionTime: boolean;
}

export const EMPTY_SESSION_DURATIONS: Readonly<SessionDurations> = {
  totalSessionMs: 0,
  effectiveStudyMs: 0,
  seatedMs: 0,
  postureCautionMs: 0,
  awayMs: 0,
  luxCautionMs: 0,
};

export const DEFAULT_TIMER_VISIBILITY_SETTINGS: Readonly<TimerVisibilitySettings> = {
  showEffectiveStudyTime: true,
  showTotalSessionTime: false,
  showPostureCautionTime: false,
  showAwayTime: false,
  showLuxCautionTime: false,
};
