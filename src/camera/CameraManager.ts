import { CAMERA_METADATA_TIMEOUT_MS, DEFAULT_CAMERA_CONSTRAINTS } from '@/camera/camera-config'
import { createCameraError, mapCameraError } from '@/camera/camera-errors'
import type { CameraDeviceOption, CameraErrorInfo } from '@/camera/camera-types'

interface CameraManagerOptions {
  mediaDevices?: MediaDevices | null
  isSecureContext?: boolean
  onStreamInterrupted?: (error: CameraErrorInfo) => void
}

function createConstraints(deviceId?: string): MediaStreamConstraints {
  return {
    audio: false,
    video: {
      ...DEFAULT_CAMERA_CONSTRAINTS,
      ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
    },
  }
}

function shouldFallbackDevice(error: unknown): boolean {
  const name =
    typeof error === 'object' && error !== null && 'name' in error
      ? String(error.name)
      : ''
  return name === 'OverconstrainedError' || name === 'NotFoundError'
}

function stopStream(stream: MediaStream): void {
  for (const track of stream.getTracks()) {
    track.stop()
  }
}

export class CameraManager {
  private readonly configuredMediaDevices: MediaDevices | null | undefined
  private readonly configuredSecureContext: boolean | undefined
  private readonly onStreamInterrupted?: (error: CameraErrorInfo) => void
  private currentDeviceId: string | null = null
  private generation = 0
  private pendingPermission: Promise<MediaStream> | null = null
  private pendingStart: Promise<MediaStream> | null = null
  private stream: MediaStream | null = null
  private videoElement: HTMLVideoElement | null = null

  constructor(options: CameraManagerOptions = {}) {
    this.configuredMediaDevices = options.mediaDevices
    this.configuredSecureContext = options.isSecureContext
    this.onStreamInterrupted = options.onStreamInterrupted
  }

  private getMediaDevices(): MediaDevices {
    const isSecure =
      this.configuredSecureContext ??
      (typeof window === 'undefined' ? true : window.isSecureContext !== false)
    if (!isSecure) {
      throw Object.assign(new Error('Camera requires a secure context.'), {
        name: 'SecurityError',
      })
    }

    const mediaDevices =
      this.configuredMediaDevices === undefined
        ? typeof navigator === 'undefined'
          ? null
          : navigator.mediaDevices
        : this.configuredMediaDevices
    if (!mediaDevices?.getUserMedia) {
      throw Object.assign(new Error('navigator.mediaDevices is unavailable.'), {
        name: 'MediaDevicesUnsupportedError',
      })
    }

    return mediaDevices
  }

  async requestPermission(preferredDeviceId?: string): Promise<MediaStream> {
    if (this.isActive() && this.stream) {
      return this.stream
    }
    if (this.pendingPermission) {
      return this.pendingPermission
    }

    const requestGeneration = this.generation
    const mediaDevices = this.getMediaDevices()
    this.pendingPermission = (async () => {
      let stream: MediaStream
      try {
        stream = await mediaDevices.getUserMedia(createConstraints(preferredDeviceId))
      } catch (error) {
        if (!preferredDeviceId || !shouldFallbackDevice(error)) {
          throw error
        }
        stream = await mediaDevices.getUserMedia(createConstraints())
      }

      if (requestGeneration !== this.generation) {
        stopStream(stream)
        throw Object.assign(new Error('Camera start was cancelled.'), { name: 'AbortError' })
      }

      this.attachStream(stream)
      return stream
    })().finally(() => {
      this.pendingPermission = null
    })

    return this.pendingPermission
  }

  async start(
    videoElement: HTMLVideoElement,
    preferredDeviceId?: string,
  ): Promise<MediaStream> {
    if (this.isActive() && this.stream) {
      await this.attachVideo(videoElement, this.stream)
      return this.stream
    }
    if (this.pendingStart) {
      return this.pendingStart
    }

    this.pendingStart = (async () => {
      const stream = await this.requestPermission(preferredDeviceId)
      await this.attachVideo(videoElement, stream)
      return stream
    })().finally(() => {
      this.pendingStart = null
    })

    return this.pendingStart
  }

  async listDevices(): Promise<CameraDeviceOption[]> {
    const mediaDevices = this.getMediaDevices()
    const devices = await mediaDevices.enumerateDevices()
    let cameraIndex = 0

    return devices
      .filter((device) => device.kind === 'videoinput')
      .map((device) => {
        cameraIndex += 1
        return {
          deviceId: device.deviceId,
          label: device.label || `카메라 ${cameraIndex}`,
          ...(device.groupId ? { groupId: device.groupId } : {}),
          isSelected: device.deviceId === this.currentDeviceId,
        }
      })
  }

  async switchDevice(
    videoElement: HTMLVideoElement,
    deviceId: string,
  ): Promise<MediaStream> {
    if (deviceId === this.currentDeviceId && this.isActive() && this.stream) {
      return this.stream
    }

    this.stop()
    return this.start(videoElement, deviceId)
  }

  stop(): void {
    this.generation += 1
    const stream = this.stream
    this.stream = null
    this.currentDeviceId = null

    if (stream) {
      stopStream(stream)
    }
    if (this.videoElement) {
      this.videoElement.pause()
      this.videoElement.srcObject = null
    }
    this.videoElement = null
  }

  subscribeDeviceChange(callback: () => void): () => void {
    let mediaDevices: MediaDevices
    try {
      mediaDevices = this.getMediaDevices()
    } catch {
      return () => undefined
    }

    mediaDevices.addEventListener('devicechange', callback)
    return () => mediaDevices.removeEventListener('devicechange', callback)
  }

  getStream(): MediaStream | null {
    return this.stream
  }

  getCurrentDeviceId(): string | null {
    return this.currentDeviceId
  }

  isActive(): boolean {
    return Boolean(
      this.stream?.getVideoTracks().some((track) => track.readyState === 'live'),
    )
  }

  private attachStream(stream: MediaStream): void {
    if (this.stream && this.stream !== stream) {
      stopStream(this.stream)
    }
    this.stream = stream

    const videoTrack = stream.getVideoTracks()[0]
    this.currentDeviceId = videoTrack?.getSettings().deviceId ?? null
    if (videoTrack) {
      videoTrack.addEventListener(
        'ended',
        () => {
          if (this.stream !== stream) return
          this.stream = null
          this.currentDeviceId = null
          if (this.videoElement) this.videoElement.srcObject = null
          this.onStreamInterrupted?.(createCameraError('STREAM_INTERRUPTED', 'TrackEnded'))
        },
        { once: true },
      )
    }
  }

  private async attachVideo(
    videoElement: HTMLVideoElement,
    stream: MediaStream,
  ): Promise<void> {
    this.videoElement = videoElement
    videoElement.autoplay = true
    videoElement.muted = true
    videoElement.playsInline = true
    videoElement.srcObject = stream

    if (videoElement.readyState < HTMLMediaElement.HAVE_METADATA) {
      await new Promise<void>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
          cleanup()
          reject(new Error('Timed out while waiting for camera metadata.'))
        }, CAMERA_METADATA_TIMEOUT_MS)
        const cleanup = () => {
          window.clearTimeout(timeoutId)
          videoElement.removeEventListener('loadedmetadata', handleLoaded)
          videoElement.removeEventListener('error', handleError)
        }
        const handleLoaded = () => {
          cleanup()
          resolve()
        }
        const handleError = () => {
          cleanup()
          reject(videoElement.error ?? new Error('Failed to load camera stream.'))
        }
        videoElement.addEventListener('loadedmetadata', handleLoaded)
        videoElement.addEventListener('error', handleError)
      })
    }

    await videoElement.play()
  }
}

export function cameraErrorFromUnknown(error: unknown): CameraErrorInfo {
  return mapCameraError(error)
}
