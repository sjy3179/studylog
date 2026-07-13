import { describe, expect, it } from 'vitest'

import { mapCameraError } from '@/camera/camera-errors'

describe('mapCameraError', () => {
  it.each([
    ['NotAllowedError', 'PERMISSION_DENIED'],
    ['NotFoundError', 'DEVICE_NOT_FOUND'],
    ['NotReadableError', 'DEVICE_BUSY'],
    ['OverconstrainedError', 'CONSTRAINT_UNSUPPORTED'],
    ['SecurityError', 'INSECURE_CONTEXT'],
    ['MediaDevicesUnsupportedError', 'MEDIA_DEVICES_UNSUPPORTED'],
    ['StreamInterruptedError', 'STREAM_INTERRUPTED'],
  ])('maps %s to %s', (name, code) => {
    expect(mapCameraError(Object.assign(new Error('test'), { name })).code).toBe(code)
  })

  it('falls back without exposing a stack trace', () => {
    const result = mapCameraError(new Error('private stack content'))
    expect(result.code).toBe('UNKNOWN')
    expect(result.message).not.toContain('private stack content')
  })
})
