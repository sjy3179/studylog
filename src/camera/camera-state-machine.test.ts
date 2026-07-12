import { describe, expect, it } from 'vitest'

import { transitionCameraStatus } from '@/camera/camera-state-machine'

describe('camera state machine', () => {
  it('moves through the normal start and stop lifecycle', () => {
    let status = transitionCameraStatus('IDLE', 'START_REQUESTED')
    expect(status).toBe('REQUESTING_PERMISSION')
    status = transitionCameraStatus(status, 'PERMISSION_GRANTED')
    expect(status).toBe('STARTING')
    status = transitionCameraStatus(status, 'READY')
    expect(status).toBe('READY')
    status = transitionCameraStatus(status, 'STOP_REQUESTED')
    expect(status).toBe('STOPPING')
    expect(transitionCameraStatus(status, 'STOPPED')).toBe('STOPPED')
  })

  it('enters error and allows retry', () => {
    expect(transitionCameraStatus('REQUESTING_PERMISSION', 'FAILED')).toBe('ERROR')
    expect(transitionCameraStatus('ERROR', 'START_REQUESTED')).toBe('REQUESTING_PERMISSION')
  })

  it('ignores impossible transitions', () => {
    expect(transitionCameraStatus('IDLE', 'READY')).toBe('IDLE')
    expect(transitionCameraStatus('READY', 'PERMISSION_GRANTED')).toBe('READY')
  })
})
