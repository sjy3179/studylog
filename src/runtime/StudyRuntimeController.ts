import { AlertManager } from '@/runtime/AlertManager'
import { LuxStateMachine } from '@/runtime/LuxStateMachine'
import { PostureFusionEngine } from '@/runtime/PostureFusionEngine'
import { PostureStateMachine } from '@/runtime/PostureStateMachine'
import { resolveStudyStatus } from '@/runtime/StudyStatusResolver'
import type {
  FusedPostureObservation,
  MediaPipePostureSignal,
  RuntimeBlockingReason,
  RuntimeControllerTickResult,
  RuntimeControlMode,
  StablePostureSnapshot,
  TmPoseSignal,
} from '@/runtime/runtime-types'
import type { LuxStatus, MockPostureState, SessionLifecycle, StablePostureState } from '@/types/study'

export interface StudyRuntimeTickInput {
  nowMs: number
  mode: RuntimeControlMode
  lifecycle: SessionLifecycle
  rawLux: number
  countLuxInEffectiveTime: boolean
  mockPosture: MockPostureState
  tmPrediction: TmPoseSignal | null
  mediaPipeSignal: MediaPipePostureSignal | null
  cameraReady: boolean
  cameraError: boolean
  mediaPipeReady: boolean
  mediaPipeError: boolean
  tmReady: boolean
  tmError: boolean
}

export class StudyRuntimeController {
  private readonly fusion = new PostureFusionEngine()
  private readonly postureMachine = new PostureStateMachine()
  private readonly luxMachine = new LuxStateMachine()
  private readonly alerts = new AlertManager()
  private mode: RuntimeControlMode | null = null

  tick(input: StudyRuntimeTickInput): RuntimeControllerTickResult {
    if (this.mode !== input.mode) {
      this.reset(input.nowMs)
      this.mode = input.mode
    }
    const stableLux = this.luxMachine.update(input.rawLux, input.nowMs)
    let fusedObservation: FusedPostureObservation | null = null
    let stablePosture: StablePostureSnapshot
    let blockingReason: RuntimeBlockingReason | null = null
    let runtimeReady = input.mode === 'MOCK'

    if (input.mode === 'MOCK') {
      stablePosture = this.mockSnapshot(input.mockPosture, input.nowMs)
    } else {
      blockingReason = this.resolveBlockingReason(input)
      runtimeReady = blockingReason === null
      fusedObservation = this.fusion.fuse({
        nowMs: input.nowMs,
        tmPrediction: input.tmPrediction,
        mediaPipeSignal: input.mediaPipeSignal,
      })
      stablePosture = this.postureMachine.update(fusedObservation, input.nowMs)
    }

    const timerPosture = this.resolveTimerPosture(
      input.mode,
      input.mockPosture,
      stablePosture,
      fusedObservation,
      runtimeReady,
    )
    const studyStatus = resolveStudyStatus({
      lifecycle: input.lifecycle,
      posture: stablePosture.state,
      luxStatus: stableLux.status,
    })
    const alertPosture = { ...stablePosture, state: timerPosture }
    const alertEvents = this.alerts.update({
      nowMs: input.nowMs,
      lifecycle: input.lifecycle,
      posture: alertPosture,
      luxStatus: stableLux.status,
      runtimeReady,
      enabled: true,
    })
    const satisfiesLux = !input.countLuxInEffectiveTime || stableLux.status === 'RECOMMENDED'

    return {
      snapshot: {
        mode: input.mode,
        fusedObservation,
        stablePosture,
        stableLux,
        studyStatus,
        runtimeReady,
        blockingReason,
        effectiveTimeEligible:
          input.lifecycle === 'RUNNING' && timerPosture === 'GOOD' && satisfiesLux,
        timerPosture,
      },
      alerts: alertEvents,
    }
  }

  reset(nowMs: number): void {
    this.postureMachine.reset(nowMs)
    this.luxMachine.reset(nowMs)
    this.alerts.reset()
  }

  private resolveBlockingReason(input: StudyRuntimeTickInput): RuntimeBlockingReason | null {
    if (input.cameraError) return 'CAMERA_ERROR'
    if (input.tmError) return 'MODEL_ERROR'
    if (!input.cameraReady) return 'CAMERA_NOT_READY'
    if (input.mediaPipeError || !input.mediaPipeReady) return 'MEDIAPIPE_NOT_READY'
    if (!input.tmReady) return 'TM_NOT_READY'
    if (!input.mediaPipeSignal?.calibrationAvailable) return 'CALIBRATION_REQUIRED'
    return null
  }

  private resolveTimerPosture(
    mode: RuntimeControlMode,
    mockPosture: MockPostureState,
    stable: StablePostureSnapshot,
    fused: FusedPostureObservation | null,
    runtimeReady: boolean,
  ): StablePostureState {
    if (mode === 'MOCK') return mockPosture
    if (!runtimeReady || !fused) return 'UNKNOWN'
    if (stable.state === 'AWAY') return 'AWAY'
    if (fused.rawState === 'UNKNOWN' || fused.rawState === 'NO_POSE') return 'UNKNOWN'
    return stable.state
  }

  private mockSnapshot(state: MockPostureState, nowMs: number): StablePostureSnapshot {
    return {
      timestampMs: nowMs,
      state,
      badReason: state === 'BAD' ? 'BASELINE_DEVIATION' : null,
      confidence: 1,
      changedAtMs: nowMs,
      stateDurationMs: 0,
      isTransitioning: false,
      candidateState: null,
      candidateDurationMs: 0,
      history: [],
      consensusCount: 0,
    }
  }
}

export function isRecommendedLux(status: LuxStatus): boolean {
  return status === 'RECOMMENDED'
}
