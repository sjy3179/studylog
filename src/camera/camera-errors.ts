import type { CameraErrorCode, CameraErrorInfo } from '@/camera/camera-types'

const ERROR_COPY: Record<CameraErrorCode, Omit<CameraErrorInfo, 'code' | 'originalName'>> = {
  PERMISSION_DENIED: {
    title: '카메라 권한이 필요합니다',
    message: '카메라 권한이 거부되었습니다. 브라우저 사이트 설정에서 권한을 허용해 주세요.',
    recoverable: true,
  },
  DEVICE_NOT_FOUND: {
    title: '카메라를 찾지 못했습니다',
    message: '사용할 수 있는 카메라를 찾지 못했습니다.',
    recoverable: true,
  },
  DEVICE_BUSY: {
    title: '카메라를 사용할 수 없습니다',
    message: '다른 프로그램에서 카메라를 사용 중일 수 있습니다.',
    recoverable: true,
  },
  CONSTRAINT_UNSUPPORTED: {
    title: '카메라 설정을 지원하지 않습니다',
    message: '요청한 카메라 설정을 지원하지 않습니다.',
    recoverable: true,
  },
  INSECURE_CONTEXT: {
    title: '보안 연결이 필요합니다',
    message: '현재 환경에서는 카메라에 접근할 수 없습니다. HTTPS 또는 localhost에서 열어 주세요.',
    recoverable: false,
  },
  MEDIA_DEVICES_UNSUPPORTED: {
    title: '카메라 기능을 지원하지 않습니다',
    message: '이 브라우저는 카메라 기능을 지원하지 않습니다.',
    recoverable: false,
  },
  STREAM_INTERRUPTED: {
    title: '카메라 연결이 중단되었습니다',
    message: '카메라 연결이 중단되었습니다. 장치를 확인한 뒤 다시 시도해 주세요.',
    recoverable: true,
  },
  UNKNOWN: {
    title: '카메라를 시작하지 못했습니다',
    message: '카메라를 시작하지 못했습니다.',
    recoverable: true,
  },
}

const ERROR_NAME_TO_CODE: Record<string, CameraErrorCode> = {
  ConstraintNotSatisfiedError: 'CONSTRAINT_UNSUPPORTED',
  MediaDevicesUnsupportedError: 'MEDIA_DEVICES_UNSUPPORTED',
  NotAllowedError: 'PERMISSION_DENIED',
  NotFoundError: 'DEVICE_NOT_FOUND',
  NotReadableError: 'DEVICE_BUSY',
  OverconstrainedError: 'CONSTRAINT_UNSUPPORTED',
  PermissionDeniedError: 'PERMISSION_DENIED',
  SecurityError: 'INSECURE_CONTEXT',
  StreamInterruptedError: 'STREAM_INTERRUPTED',
}

export function createCameraError(
  code: CameraErrorCode,
  originalName?: string,
): CameraErrorInfo {
  return { code, ...ERROR_COPY[code], ...(originalName ? { originalName } : {}) }
}

export function mapCameraError(error: unknown): CameraErrorInfo {
  const originalName =
    typeof error === 'object' && error !== null && 'name' in error && typeof error.name === 'string'
      ? error.name
      : undefined
  const code = originalName ? (ERROR_NAME_TO_CODE[originalName] ?? 'UNKNOWN') : 'UNKNOWN'

  return createCameraError(code, originalName)
}
