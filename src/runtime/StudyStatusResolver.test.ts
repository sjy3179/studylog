import { describe, expect, it } from 'vitest'

import { resolveStudyStatus } from '@/runtime/StudyStatusResolver'

describe('resolveStudyStatus', () => {
  it.each([
    ['GOOD', 'RECOMMENDED', 'STUDYING'],
    ['BAD', 'RECOMMENDED', 'POSTURE_CAUTION'],
    ['GOOD', 'DARK', 'LUX_CAUTION'],
    ['BAD', 'DARK', 'MULTI_CAUTION'],
    ['AWAY', 'RECOMMENDED', 'AWAY'],
    ['UNKNOWN', 'RECOMMENDED', 'CHECKING'],
  ] as const)('maps %s + %s to %s', (posture, luxStatus, expected) => {
    expect(resolveStudyStatus({ lifecycle: 'RUNNING', posture, luxStatus })).toBe(expected)
  })

  it('prioritizes PAUSED lifecycle', () => {
    expect(resolveStudyStatus({ lifecycle: 'PAUSED', posture: 'GOOD', luxStatus: 'RECOMMENDED' })).toBe('PAUSED')
  })
})
