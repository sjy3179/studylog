export type CameraStatus =
  | 'IDLE'
  | 'REQUESTING_PERMISSION'
  | 'STARTING'
  | 'READY'
  | 'STOPPING'
  | 'STOPPED'
  | 'ERROR'

export type CameraErrorCode =
  | 'PERMISSION_DENIED'
  | 'DEVICE_NOT_FOUND'
  | 'DEVICE_BUSY'
  | 'CONSTRAINT_UNSUPPORTED'
  | 'INSECURE_CONTEXT'
  | 'MEDIA_DEVICES_UNSUPPORTED'
  | 'STREAM_INTERRUPTED'
  | 'UNKNOWN'

export interface CameraErrorInfo {
  code: CameraErrorCode
  title: string
  message: string
  recoverable: boolean
  originalName?: string
}

export interface CameraDeviceOption {
  deviceId: string
  label: string
  groupId?: string
  isSelected: boolean
}
