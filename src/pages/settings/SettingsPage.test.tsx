import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useStudySettingsStore } from '@/stores/useStudyStore'
import { DEFAULT_TIMER_VISIBILITY_SETTINGS } from '@/types/study'

import { SettingsPage } from './SettingsPage'

const SETTINGS_STORAGE_KEY = 'studylog-settings-v1'

function resetSettingsStore() {
  useStudySettingsStore.setState({
    countLuxInEffectiveTime: true,
    goalMinutes: 120,
    subject: '수학',
    timerVisibility: { ...DEFAULT_TIMER_VISIBILITY_SETTINGS },
  })
}

describe('SettingsPage', () => {
  beforeEach(() => {
    localStorage.clear()
    resetSettingsStore()
  })

  afterEach(() => {
    resetSettingsStore()
    localStorage.clear()
  })

  it('keeps away time hidden by default and persists the enabled setting', async () => {
    const user = userEvent.setup()

    render(<SettingsPage />)

    const awayTimeSwitch = screen.getByRole('switch', {
      name: '자리 비움 시간',
    })

    expect(awayTimeSwitch.getAttribute('aria-checked')).toBe('false')
    expect(
      useStudySettingsStore.getState().timerVisibility.showAwayTime,
    ).toBe(false)

    await user.click(awayTimeSwitch)

    expect(awayTimeSwitch.getAttribute('aria-checked')).toBe('true')
    expect(
      useStudySettingsStore.getState().timerVisibility.showAwayTime,
    ).toBe(true)

    const persistedSettings = JSON.parse(
      localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}',
    ) as {
      state?: {
        timerVisibility?: {
          showAwayTime?: boolean
        }
      }
    }

    expect(persistedSettings.state?.timerVisibility?.showAwayTime).toBe(true)
  })
})
