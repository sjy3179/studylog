import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CameraManager } from '@/camera/CameraManager'

interface MockTrack extends MediaStreamTrack {
  emitEnded: () => void
}

function createTrack(deviceId: string): MockTrack {
  let endedListener: (() => void) | null = null
  const track = {
    readyState: 'live',
    stop: vi.fn(() => {
      Object.defineProperty(track, 'readyState', { configurable: true, value: 'ended' })
    }),
    getSettings: vi.fn(() => ({ deviceId })),
    addEventListener: vi.fn((event: string, callback: EventListenerOrEventListenerObject) => {
      if (event === 'ended') {
        endedListener = typeof callback === 'function' ? () => callback(new Event('ended')) : () => callback.handleEvent(new Event('ended'))
      }
    }),
    emitEnded: () => endedListener?.(),
  }
  return track as unknown as MockTrack
}

function createStream(deviceId: string) {
  const track = createTrack(deviceId)
  const stream = {
    getTracks: () => [track],
    getVideoTracks: () => [track],
  } as unknown as MediaStream
  return { stream, track }
}

function createVideo(): HTMLVideoElement {
  const video = document.createElement('video')
  Object.defineProperty(video, 'readyState', { configurable: true, value: HTMLMediaElement.HAVE_METADATA })
  Object.defineProperty(video, 'srcObject', { configurable: true, value: null, writable: true })
  video.play = vi.fn().mockResolvedValue(undefined)
  video.pause = vi.fn()
  return video
}

function createMediaDevices(getUserMedia: ReturnType<typeof vi.fn>): MediaDevices {
  return {
    getUserMedia,
    enumerateDevices: vi.fn().mockResolvedValue([
      { kind: 'videoinput', deviceId: 'camera-a', groupId: 'group-a', label: 'Front' },
      { kind: 'audioinput', deviceId: 'microphone', groupId: '', label: 'Mic' },
    ]),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as MediaDevices
}

describe('CameraManager', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls getUserMedia once and prevents duplicate starts', async () => {
    const { stream } = createStream('camera-a')
    const getUserMedia = vi.fn().mockResolvedValue(stream)
    const manager = new CameraManager({ mediaDevices: createMediaDevices(getUserMedia), isSecureContext: true })
    const video = createVideo()

    await Promise.all([manager.start(video), manager.start(video)])

    expect(getUserMedia).toHaveBeenCalledTimes(1)
    expect(video.srcObject).toBe(stream)
  })

  it('stops every track and clears video.srcObject', async () => {
    const { stream, track } = createStream('camera-a')
    const manager = new CameraManager({
      mediaDevices: createMediaDevices(vi.fn().mockResolvedValue(stream)),
      isSecureContext: true,
    })
    const video = createVideo()
    await manager.start(video)

    manager.stop()

    expect(track.stop).toHaveBeenCalledOnce()
    expect(video.srcObject).toBeNull()
    expect(manager.getStream()).toBeNull()
  })

  it('stops the previous stream when switching devices', async () => {
    const first = createStream('camera-a')
    const second = createStream('camera-b')
    const getUserMedia = vi.fn().mockResolvedValueOnce(first.stream).mockResolvedValueOnce(second.stream)
    const manager = new CameraManager({ mediaDevices: createMediaDevices(getUserMedia), isSecureContext: true })
    const video = createVideo()
    await manager.start(video)

    await manager.switchDevice(video, 'camera-b')

    expect(first.track.stop).toHaveBeenCalledOnce()
    expect(manager.getCurrentDeviceId()).toBe('camera-b')
  })

  it('falls back to the default camera when an exact device is unavailable', async () => {
    const fallback = createStream('camera-a')
    const getUserMedia = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error('missing'), { name: 'OverconstrainedError' }))
      .mockResolvedValueOnce(fallback.stream)
    const manager = new CameraManager({ mediaDevices: createMediaDevices(getUserMedia), isSecureContext: true })

    await manager.start(createVideo(), 'missing-camera')

    expect(getUserMedia).toHaveBeenCalledTimes(2)
    expect(getUserMedia.mock.calls[0][0].video.deviceId).toEqual({ exact: 'missing-camera' })
    expect(getUserMedia.mock.calls[1][0].video.deviceId).toBeUndefined()
  })

  it('reports a stream interruption when the active track ends', async () => {
    const interrupted = vi.fn()
    const { stream, track } = createStream('camera-a')
    const manager = new CameraManager({
      mediaDevices: createMediaDevices(vi.fn().mockResolvedValue(stream)),
      isSecureContext: true,
      onStreamInterrupted: interrupted,
    })
    await manager.start(createVideo())

    track.emitEnded()

    expect(interrupted).toHaveBeenCalledWith(expect.objectContaining({ code: 'STREAM_INTERRUPTED' }))
    expect(manager.getStream()).toBeNull()
  })

  it('lists only video devices and marks the selected one', async () => {
    const { stream } = createStream('camera-a')
    const manager = new CameraManager({
      mediaDevices: createMediaDevices(vi.fn().mockResolvedValue(stream)),
      isSecureContext: true,
    })
    await manager.start(createVideo())

    await expect(manager.listDevices()).resolves.toEqual([
      { deviceId: 'camera-a', groupId: 'group-a', isSelected: true, label: 'Front' },
    ])
  })
})
