import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { MockPostureClassifier } from '@/ai/MockPostureClassifier'
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
  subject: string
  timerVisibility: TimerVisibilitySettings
  setCountLuxInEffectiveTime: (value: boolean) => void
  setGoalMinutes: (value: number) => void
  setSubject: (value: string) => void
  setTimerVisibility: (key: DetailVisibilityKey, value: boolean) => void
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
      subject: '수학',
      timerVisibility: { ...DEFAULT_TIMER_VISIBILITY_SETTINGS },
      setCountLuxInEffectiveTime: (value) => {
        set({ countLuxInEffectiveTime: value })
      },
      setGoalMinutes: (value) => {
        set({ goalMinutes: Math.min(600, Math.max(10, Math.round(value))) })
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
        subject: state.subject,
        timerVisibility: state.timerVisibility,
      }),
    },
  ),
)

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
