export const DEFAULT_CAMERA_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  frameRate: { ideal: 30, max: 30 },
  facingMode: { ideal: 'user' },
}

export const CAMERA_METADATA_TIMEOUT_MS = 10_000
