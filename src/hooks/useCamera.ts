import { useCallback, useEffect, useReducer, useRef, useState, type RefObject } from 'react'

import { CameraManager, cameraErrorFromUnknown } from '@/camera/CameraManager'
import { transitionCameraStatus } from '@/camera/camera-state-machine'
import type { CameraDeviceOption, CameraErrorInfo, CameraStatus } from '@/camera/camera-types'
import { useStudySettingsStore } from '@/stores/useStudyStore'

export interface UseCameraResult {
  videoRef: RefObject<HTMLVideoElement | null>
  status: CameraStatus
  devices: CameraDeviceOption[]
  selectedDeviceId: string | null
  error: CameraErrorInfo | null
  start: () => Promise<void>
  stop: () => void
  switchDevice: (deviceId: string) => Promise<void>
  retry: () => Promise<void>
}

export function useCamera(): UseCameraResult {
  const preferredDeviceId = useStudySettingsStore((state) => state.selectedCameraDeviceId)
  const persistSelectedDevice = useStudySettingsStore((state) => state.setSelectedCameraDeviceId)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const mountedRef = useRef(true)
  const [status, dispatchStatus] = useReducer(transitionCameraStatus, 'IDLE' as CameraStatus)
  const [devices, setDevices] = useState<CameraDeviceOption[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(preferredDeviceId)
  const [error, setError] = useState<CameraErrorInfo | null>(null)
  const [manager] = useState(
    () => new CameraManager({
      onStreamInterrupted: (nextError) => {
        setError(nextError)
        dispatchStatus('FAILED')
      },
    }),
  )

  const refreshDevices = useCallback(async () => {
    try {
      const options = await manager.listDevices()
      if (mountedRef.current && options) setDevices(options)
    } catch {
      // Device labels are optional before permission; camera start handles actionable errors.
    }
  }, [manager])

  const start = useCallback(async () => {
    const video = videoRef.current
    if (!video) return
    setError(null)
    dispatchStatus('START_REQUESTED')
    try {
      await manager.requestPermission(preferredDeviceId ?? undefined)
      if (!mountedRef.current) return
      dispatchStatus('PERMISSION_GRANTED')
      await manager.start(video, preferredDeviceId ?? undefined)
      if (!mountedRef.current) return
      const actualDeviceId = manager.getCurrentDeviceId()
      setSelectedDeviceId(actualDeviceId)
      persistSelectedDevice(actualDeviceId)
      dispatchStatus('READY')
      await refreshDevices()
    } catch (cause) {
      if (!mountedRef.current || (cause instanceof DOMException && cause.name === 'AbortError')) return
      setError(cameraErrorFromUnknown(cause))
      dispatchStatus('FAILED')
    }
  }, [manager, persistSelectedDevice, preferredDeviceId, refreshDevices])

  const stop = useCallback(() => {
    dispatchStatus('STOP_REQUESTED')
    manager.stop()
    dispatchStatus('STOPPED')
  }, [manager])

  const switchDevice = useCallback(
    async (deviceId: string) => {
      const video = videoRef.current
      if (!video) return
      setError(null)
      dispatchStatus('STOP_REQUESTED')
      try {
        dispatchStatus('PERMISSION_GRANTED')
        await manager.switchDevice(video, deviceId)
        if (!mountedRef.current) return
        const actualDeviceId = manager.getCurrentDeviceId()
        setSelectedDeviceId(actualDeviceId)
        persistSelectedDevice(actualDeviceId)
        dispatchStatus('READY')
        await refreshDevices()
      } catch (cause) {
        if (!mountedRef.current) return
        setError(cameraErrorFromUnknown(cause))
        dispatchStatus('FAILED')
      }
    },
    [manager, persistSelectedDevice, refreshDevices],
  )

  useEffect(() => {
    mountedRef.current = true
    const unsubscribe = manager.subscribeDeviceChange(() => void refreshDevices())
    return () => {
      mountedRef.current = false
      unsubscribe?.()
      manager.stop()
    }
  }, [manager, refreshDevices])

  return { videoRef, status, devices, selectedDeviceId, error, start, stop, switchDevice, retry: start }
}
