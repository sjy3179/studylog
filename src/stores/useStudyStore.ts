import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { MockPostureClassifier } from '@/ai/MockPostureClassifier'
import {
  clearCalibrationProfile,
  loadCalibrationProfile,
  saveCalibrationProfile,
} from '@/ai/calibration-storage'
import type { CalibrationProfile } from '@/ai/pose-types'
import { MockLuxProvider } from '@/sensors/MockLuxProvider'
import {
  DEFAULT_TIMER_VISIBILITY_SETTINGS,
  EMPTY_SESSION_DURATIONS,
  type MockPostureState,
  type SessionDurations,
  type SessionLifecycle,
  type TimerVisibilitySettings,
} from '@/types/study'

type DetailVisibilityKey = Exclude<
  keyof TimerVisibilitySettings,
  'showEffectiveStudyTime'
>

interface StudySettingsState {
  countLuxInEffectiveTime: boolean
  goalMinutes: number
  mirrorCamera: boolean
  selectedCameraDeviceId: string | null
  showCameraPreview: boolean
  showPoseOverlay: boolean
  subject: string
  timerVisibility: TimerVisibilitySettings
  setCountLuxInEffectiveTime: (value: boolean) => void
  setGoalMinutes: (value: number) => void
  setMirrorCamera: (value: boolean) => void
  setSelectedCameraDeviceId: (value: string | null) => void
  setShowCameraPreview: (value: boolean) => void
  setShowPoseOverlay: (value: boolean) => void
  setSubject: (value: string) => void
  setTimerVisibility: (key: DetailVisibilityKey, value: boolean) => void
}

interface CalibrationState {
  profile: CalibrationProfile | null
  clearProfile: () => void
  setProfile: (profile: CalibrationProfile) => void
}

interface StudySessionState {
  durations: SessionDurations
  lifecycle: SessionLifecycle
  lux: number
  posture: MockPostureState
  sessionRevision: number
  finishSession: () => void
  pauseSession: () => void
  resetSession: () => void
  setLux: (value: number) => void
  setPosture: (value: MockPostureState) => void
  startSession: () => void
  updateDurations: (durations: Readonly<SessionDurations>) => void
}

const postureClassifier = new MockPostureClassifier('GOOD')
const luxProvider = new MockLuxProvider(620)

function createEmptyDurations(): SessionDurations {
  return { ...EMPTY_SESSION_DURATIONS }
}

export const useStudySettingsStore = create<StudySettingsState>()(
  persist(
    (set) => ({
      countLuxInEffectiveTime: true,
      goalMinutes: 120,
      mirrorCamera: true,
      selectedCameraDeviceId: null,
      showCameraPreview: true,
      showPoseOverlay: true,
      subject: '수학',
      timerVisibility: { ...DEFAULT_TIMER_VISIBILITY_SETTINGS },
      setCountLuxInEffectiveTime: (value) => {
        set({ countLuxInEffectiveTime: value })
      },
      setGoalMinutes: (value) => {
        set({ goalMinutes: Math.min(600, Math.max(10, Math.round(value))) })
      },
      setMirrorCamera: (value) => {
        set({ mirrorCamera: value })
      },
      setSelectedCameraDeviceId: (value) => {
        set({ selectedCameraDeviceId: value })
      },
      setShowCameraPreview: (value) => {
        set({ showCameraPreview: value })
      },
      setShowPoseOverlay: (value) => {
        set({ showPoseOverlay: value })
      },
      setSubject: (value) => {
        set({ subject: value })
      },
      setTimerVisibility: (key, value) => {
        set((state) => ({
          timerVisibility: {
            ...state.timerVisibility,
            [key]: value,
          },
        }))
      },
    }),
    {
      name: 'studylog-settings-v1',
      partialize: (state) => ({
        countLuxInEffectiveTime: state.countLuxInEffectiveTime,
        goalMinutes: state.goalMinutes,
        mirrorCamera: state.mirrorCamera,
        selectedCameraDeviceId: state.selectedCameraDeviceId,
        showCameraPreview: state.showCameraPreview,
        showPoseOverlay: state.showPoseOverlay,
        subject: state.subject,
        timerVisibility: state.timerVisibility,
      }),
    },
  ),
)

export const useCalibrationStore = create<CalibrationState>((set) => ({
  profile: typeof localStorage === 'undefined' ? null : loadCalibrationProfile(),
  clearProfile: () => {
    if (typeof localStorage !== 'undefined') clearCalibrationProfile()
    set({ profile: null })
  },
  setProfile: (profile) => {
    if (typeof localStorage !== 'undefined') saveCalibrationProfile(profile)
    set({ profile })
  },
}))

export const useStudySessionStore = create<StudySessionState>((set) => ({
  durations: createEmptyDurations(),
  lifecycle: 'IDLE',
  lux: luxProvider.getLux(),
  posture: postureClassifier.getState(),
  sessionRevision: 0,
  finishSession: () => {
    set((state) => ({
      lifecycle:
        state.lifecycle === 'RUNNING' || state.lifecycle === 'PAUSED'
          ? 'FINISHED'
          : state.lifecycle,
    }))
  },
  pauseSession: () => {
    set((state) => ({
      lifecycle: state.lifecycle === 'RUNNING' ? 'PAUSED' : state.lifecycle,
    }))
  },
  resetSession: () => {
    set((state) => ({
      durations: createEmptyDurations(),
      lifecycle: 'IDLE',
      sessionRevision: state.sessionRevision + 1,
    }))
  },
  setLux: (value) => {
    luxProvider.setLux(value)
    set({ lux: luxProvider.getLux() })
  },
  setPosture: (value) => {
    postureClassifier.setState(value)
    set({ posture: postureClassifier.getState() })
  },
  startSession: () => {
    set((state) => {
      const isNewSession = state.lifecycle === 'IDLE' || state.lifecycle === 'FINISHED'

      return {
        durations: isNewSession ? createEmptyDurations() : state.durations,
        lifecycle: 'RUNNING',
        sessionRevision: isNewSession
          ? state.sessionRevision + 1
          : state.sessionRevision,
      }
    })
  },
  updateDurations: (durations) => {
    set({ durations: { ...durations } })
  },
}))
