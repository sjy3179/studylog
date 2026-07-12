import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LandingIntro } from '@/components/landing/LandingIntro'

describe('LandingIntro', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.useFakeTimers()
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('reveals once per browser session and can be skipped', () => {
    const view = render(<LandingIntro />)
    fireEvent.click(screen.getByRole('button', { name: 'StudyLog 인트로 건너뛰기' }))

    act(() => vi.advanceTimersByTime(450))

    expect(screen.queryByRole('button', { name: 'StudyLog 인트로 건너뛰기' })).toBeNull()
    expect(sessionStorage.getItem('studylog:landing-intro:v1')).toBe('seen')

    view.unmount()
    render(<LandingIntro />)
    expect(screen.queryByRole('button', { name: 'StudyLog 인트로 건너뛰기' })).toBeNull()
  })
})
