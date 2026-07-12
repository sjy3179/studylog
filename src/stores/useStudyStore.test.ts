import { beforeEach, describe, expect, it } from 'vitest'

import { useStudySessionStore } from '@/stores/useStudyStore'

describe('study runtime mode store', () => {
  beforeEach(() => {
    useStudySessionStore.setState({
      controlMode: 'MOCK',
      mockPosture: 'GOOD',
      posture: 'GOOD',
      runtimeSnapshot: null,
      runtimeRevision: 0,
    })
  })

  it('does not let Mock controls overwrite AI posture', () => {
    useStudySessionStore.getState().setControlMode('AI')
    useStudySessionStore.getState().setPosture('BAD')

    expect(useStudySessionStore.getState()).toMatchObject({
      controlMode: 'AI',
      mockPosture: 'BAD',
      posture: 'UNKNOWN',
    })
  })

  it('restores only the selected Mock state during an explicit mode switch', () => {
    useStudySessionStore.getState().setPosture('AWAY')
    useStudySessionStore.getState().setControlMode('AI')
    useStudySessionStore.getState().setControlMode('MOCK')

    expect(useStudySessionStore.getState().posture).toBe('AWAY')
  })
})
