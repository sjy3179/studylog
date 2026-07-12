import { useCallback, useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

const INTRO_STORAGE_KEY = 'studylog:landing-intro:v1'
const EXIT_DELAY_MS = 1850
const REMOVE_DELAY_MS = 2450

function hasSeenIntro(): boolean {
  try {
    return (
      sessionStorage.getItem(INTRO_STORAGE_KEY) === 'seen' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
  } catch {
    return false
  }
}

function rememberIntro(): void {
  try {
    sessionStorage.setItem(INTRO_STORAGE_KEY, 'seen')
  } catch {
    // The intro can still complete when browser storage is unavailable.
  }
}

export function LandingIntro() {
  const [visible, setVisible] = useState(() => !hasSeenIntro())
  const [exiting, setExiting] = useState(false)

  const dismiss = useCallback(() => {
    rememberIntro()
    setExiting(true)
    window.setTimeout(() => setVisible(false), 450)
  }, [])

  useEffect(() => {
    if (!visible) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const exitTimer = window.setTimeout(() => setExiting(true), EXIT_DELAY_MS)
    const removeTimer = window.setTimeout(() => {
      rememberIntro()
      setVisible(false)
    }, REMOVE_DELAY_MS)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') dismiss()
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.clearTimeout(exitTimer)
      window.clearTimeout(removeTimer)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [dismiss, visible])

  if (!visible) return null

  return (
    <button
      aria-label="StudyLog 인트로 건너뛰기"
      className={cn('landing-intro', exiting && 'landing-intro--exiting')}
      onClick={dismiss}
      type="button"
    >
      <span className="landing-intro__logo" aria-hidden="true">
        <img className="landing-intro__logo-base" src="/studylog_logo.svg" alt="" />
        <span className="landing-intro__logo-reveal">
          <img src="/studylog_logo.svg" alt="" />
        </span>
        <span className="landing-intro__shine" />
      </span>
      <span className="landing-intro__caption">Study better, one moment at a time.</span>
      <span className="landing-intro__skip">클릭하여 건너뛰기</span>
    </button>
  )
}
