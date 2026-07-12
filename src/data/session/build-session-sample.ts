import type { SessionKind, SessionRecordingSnapshot, SessionSample } from '@/data/session/session-data-types'

export function buildSessionSample(sessionId: string, sequence: number, kind: SessionKind, snapshot: SessionRecordingSnapshot): SessionSample {
  const runtime = snapshot.runtimeSnapshot
  const fused = runtime?.fusedObservation
  const probabilities = fused?.tmProbabilities
  return {
    schemaVersion: 1, id: `${sessionId}:${sequence}`, sessionId, sequence, timestampIso: snapshot.nowIso,
    elapsedMs: snapshot.durations.totalSessionMs, subject: snapshot.subject, goalMinutes: snapshot.goalMinutes, sessionKind: kind,
    controlMode: snapshot.controlMode, lifecycle: snapshot.lifecycle, stablePostureState: runtime?.stablePosture.state ?? 'UNKNOWN',
    badPostureReason: runtime?.stablePosture.badReason ?? null, rawPostureState: fused?.rawState ?? null, studyStatus: runtime?.studyStatus ?? 'PAUSED',
    runtimeReady: runtime?.runtimeReady ?? false, blockingReason: runtime?.blockingReason ?? null, effectiveTimeEligible: runtime?.effectiveTimeEligible ?? false,
    tmLabel: fused?.tmLabel ?? null, tmConfidence: fused?.tmConfidence ?? null, tmGoodProbability: probabilities?.GOOD_POSTURE ?? null,
    tmForwardProbability: probabilities?.FORWARD_LEAN ?? null, tmSideProbability: probabilities?.SIDE_LEAN ?? null, tmRestingProbability: probabilities?.RESTING ?? null,
    tmFresh: fused?.tmFresh ?? false, poseDetected: fused?.poseDetected ?? false, mediaPipeFresh: fused?.mediaPipeFresh ?? false,
    deviationScore: fused?.deviationScore ?? null, deviationReasons: fused?.deviationReasons ?? [], lux: snapshot.rawLux,
    luxStatus: runtime?.stableLux.status ?? 'RECOMMENDED', ...snapshot.durations, modelVersion: snapshot.modelVersion, calibrationProfileId: snapshot.calibrationProfileId,
  }
}
