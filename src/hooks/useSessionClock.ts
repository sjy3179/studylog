import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { getLuxStatus } from '@/sensors/LuxProvider'
import { SessionTimer } from '@/session/SessionTimer'
import {
  useStudySessionStore,
  useStudySettingsStore,
} from '@/stores/useStudyStore'
import type { SessionTimerSample } from '@/types/study'

export function useSessionClock() {
  const lifecycle = useStudySessionStore((state) => state.lifecycle)
  const lux = useStudySessionStore((state) => state.lux)
  const posture = useStudySessionStore((state) => state.posture)
  const sessionRevision = useStudySessionStore((state) => state.sessionRevision)
  const updateDurations = useStudySessionStore((state) => state.updateDurations)
  const countLuxInEffectiveTime = useStudySettingsStore(
    (state) => state.countLuxInEffectiveTime,
  )

  const timerRef = useRef<SessionTimer | null>(null)
  const sampleRef = useRef<SessionTimerSample>({
    countLuxInEffectiveTime,
    lifecycle,
    luxStatus: getLuxStatus(lux),
    posture,
  })

  if (timerRef.current === null) {
    timerRef.current = new SessionTimer()
  }

  useEffect(() => {
    const now = performance.now()
    const session = useStudySessionStore.getState()
    const settings = useStudySettingsStore.getState()
    const nextSample: SessionTimerSample = {
      countLuxInEffectiveTime: settings.countLuxInEffectiveTime,
      lifecycle: session.lifecycle,
      luxStatus: getLuxStatus(session.lux),
      posture: session.posture,
    }
    const durations = timerRef.current?.reset(now)
    sampleRef.current = nextSample

    if (durations) {
      updateDurations(durations)
    }
  }, [sessionRevision, updateDurations])

  useEffect(() => {
    const nextSample: SessionTimerSample = {
      countLuxInEffectiveTime,
      lifecycle,
      luxStatus: getLuxStatus(lux),
      posture,
    }
    const durations = timerRef.current?.tick(performance.now(), sampleRef.current)
    sampleRef.current = nextSample

    if (durations) {
      updateDurations(durations)
    }
  }, [countLuxInEffectiveTime, lifecycle, lux, posture, updateDurations])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const durations = timerRef.current?.tick(performance.now(), sampleRef.current)

      if (durations) {
        useStudySessionStore.getState().updateDurations(durations)
      }
    }, 1_000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    const handleVisibilityChange = () => {
      const session = useStudySessionStore.getState()

      if (document.hidden && session.lifecycle === 'RUNNING') {
        session.pauseSession()
        toast.info('탭이 숨겨져 세션을 자동으로 일시정지했습니다.')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
}
