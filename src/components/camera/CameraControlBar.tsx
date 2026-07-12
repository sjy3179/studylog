import type { CameraDeviceOption } from '@/camera/camera-types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

interface CameraControlBarProps {
  devices: CameraDeviceOption[]
  mirrorCamera: boolean
  onMirrorChange: (value: boolean) => void
  onOverlayChange: (value: boolean) => void
  onPreviewChange: (value: boolean) => void
  onSwitchDevice: (deviceId: string) => void
  selectedDeviceId: string | null
  showOverlay: boolean
  showPreview: boolean
}

function ToggleControl({
  checked,
  id,
  label,
  onCheckedChange,
}: {
  checked: boolean
  id: string
  label: string
  onCheckedChange: (value: boolean) => void
}) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 rounded-xl border bg-background px-3">
      <label className="text-xs font-medium" htmlFor={id}>{label}</label>
      <Switch checked={checked} id={id} onCheckedChange={onCheckedChange} />
    </div>
  )
}

export function CameraControlBar({
  devices,
  mirrorCamera,
  onMirrorChange,
  onOverlayChange,
  onPreviewChange,
  onSwitchDevice,
  selectedDeviceId,
  showOverlay,
  showPreview,
}: CameraControlBarProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <ToggleControl checked={showPreview} id="camera-preview" label="미리보기" onCheckedChange={onPreviewChange} />
      <ToggleControl checked={showOverlay} id="pose-overlay" label="관절 표시" onCheckedChange={onOverlayChange} />
      <ToggleControl checked={mirrorCamera} id="mirror-camera" label="좌우반전" onCheckedChange={onMirrorChange} />
      <div className="min-w-0">
        <label className="sr-only" htmlFor="camera-device">카메라 선택</label>
        <Select disabled={devices.length === 0} onValueChange={onSwitchDevice} value={selectedDeviceId ?? undefined}>
          <SelectTrigger className="min-h-11 w-full" id="camera-device">
            <SelectValue placeholder="카메라 선택" />
          </SelectTrigger>
          <SelectContent>
            {devices.map((device) => (
              <SelectItem key={device.deviceId} value={device.deviceId}>{device.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
