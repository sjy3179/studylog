import {
  BellRing,
  Camera,
  Check,
  EyeOff,
  Info,
  Lightbulb,
  LockKeyhole,
  Settings2,
  ShieldCheck,
  Sparkles,
  Timer,
} from 'lucide-react'

import { CameraPanel } from '@/components/camera/CameraPanel'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useStudySessionStore,
  useStudySettingsStore,
} from '@/stores/useStudyStore'

interface SettingRowProps {
  checked: boolean
  description: string
  disabled?: boolean
  id: string
  label: string
  onCheckedChange?: (checked: boolean) => void
}

function SettingRow({
  checked,
  description,
  disabled = false,
  id,
  label,
  onCheckedChange,
}: SettingRowProps) {
  return (
    <div className="flex min-h-16 items-center justify-between gap-4 py-3">
      <div className="space-y-1">
        <Label className="text-sm font-medium" htmlFor={id}>{label}</Label>
        <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <Switch
        aria-describedby={`${id}-description`}
        checked={checked}
        disabled={disabled}
        id={id}
        onCheckedChange={onCheckedChange}
      />
      <span className="sr-only" id={`${id}-description`}>{description}</span>
    </div>
  )
}

export function SettingsPage() {
  const countLuxInEffectiveTime = useStudySettingsStore(
    (state) => state.countLuxInEffectiveTime,
  )
  const setCountLuxInEffectiveTime = useStudySettingsStore(
    (state) => state.setCountLuxInEffectiveTime,
  )
  const setTimerVisibility = useStudySettingsStore(
    (state) => state.setTimerVisibility,
  )
  const timerVisibility = useStudySettingsStore((state) => state.timerVisibility)
  const mirrorCamera = useStudySettingsStore((state) => state.mirrorCamera)
  const selectedCameraDeviceId = useStudySettingsStore((state) => state.selectedCameraDeviceId)
  const setMirrorCamera = useStudySettingsStore((state) => state.setMirrorCamera)
  const setShowCameraPreview = useStudySettingsStore((state) => state.setShowCameraPreview)
  const setShowPoseOverlay = useStudySettingsStore((state) => state.setShowPoseOverlay)
  const showCameraPreview = useStudySettingsStore((state) => state.showCameraPreview)
  const showPoseOverlay = useStudySettingsStore((state) => state.showPoseOverlay)
  const resetSession = useStudySessionStore((state) => state.resetSession)

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Settings2 aria-hidden="true" className="size-4" />
          로컬 설정
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">설정</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          순공 시간 표시와 로컬 카메라·MediaPipe 설정을 이 브라우저에서 관리합니다.
        </p>
      </header>

      <Tabs defaultValue="timer">
        <TabsList className="grid h-auto w-full grid-cols-3 p-1 sm:w-auto sm:min-w-[460px]">
          <TabsTrigger className="min-h-10 gap-2" value="timer">
            <Timer aria-hidden="true" className="hidden size-4 sm:block" />
            타이머
          </TabsTrigger>
          <TabsTrigger className="min-h-10 gap-2" value="sensors">
            <Camera aria-hidden="true" className="hidden size-4 sm:block" />
            카메라·AI
          </TabsTrigger>
          <TabsTrigger className="min-h-10 gap-2" value="privacy">
            <ShieldCheck aria-hidden="true" className="hidden size-4 sm:block" />
            알림·개인정보
          </TabsTrigger>
        </TabsList>

        <TabsContent className="mt-5 space-y-5" value="timer">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">타이머 표시</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              <SettingRow
                checked
                description="studylog의 핵심 지표로 항상 표시됩니다."
                disabled
                id="show-effective"
                label="순공 시간"
              />
              <SettingRow
                checked={timerVisibility.showTotalSessionTime}
                description="자리 비움까지 포함한 RUNNING 전체 시간을 메인에 표시합니다."
                id="show-total"
                label="전체 세션 시간"
                onCheckedChange={(checked) => setTimerVisibility('showTotalSessionTime', checked)}
              />
              <SettingRow
                checked={timerVisibility.showPostureCautionTime}
                description="사람이 감지됐지만 Mock 자세가 BAD였던 시간을 표시합니다."
                id="show-posture"
                label="자세 주의 시간"
                onCheckedChange={(checked) => setTimerVisibility('showPostureCautionTime', checked)}
              />
              <SettingRow
                checked={timerVisibility.showAwayTime}
                description="내부에는 항상 기록되지만 기본 화면에서는 숨기는 자리 비움 시간을 표시합니다."
                id="show-away"
                label="자리 비움 시간"
                onCheckedChange={(checked) => setTimerVisibility('showAwayTime', checked)}
              />
              <SettingRow
                checked={timerVisibility.showLuxCautionTime}
                description="착석 중 권장 범위를 벗어난 조도 시간을 표시합니다."
                id="show-lux"
                label="조도 주의 시간"
                onCheckedChange={(checked) => setTimerVisibility('showLuxCautionTime', checked)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">순공 계산</CardTitle>
            </CardHeader>
            <CardContent>
              <SettingRow
                checked={countLuxInEffectiveTime}
                description="켜면 GOOD + RECOMMENDED에서만 순공 시간이 증가합니다. 꺼도 조도 경고와 내부 기록은 유지됩니다."
                id="count-lux"
                label="조도 조건을 순공 시간 계산에 포함"
                onCheckedChange={setCountLuxInEffectiveTime}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="mt-5 space-y-5" value="sensors">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">카메라</CardTitle>
                <Badge variant="outline">브라우저 로컬 설정</Badge>
              </div>
            </CardHeader>
            <CardContent className="divide-y">
              <SettingRow
                checked={showCameraPreview}
                description="카메라가 켜져 있을 때 원본 미리보기 표시 여부를 바꿉니다. 분석 입력은 저장되지 않습니다."
                id="settings-camera-preview"
                label="카메라 미리보기 표시"
                onCheckedChange={setShowCameraPreview}
              />
              <SettingRow
                checked={showPoseOverlay}
                description="MediaPipe가 찾은 관절점과 연결선을 미리보기 위에 표시합니다."
                id="settings-pose-overlay"
                label="MediaPipe 관절 오버레이"
                onCheckedChange={setShowPoseOverlay}
              />
              <SettingRow
                checked={mirrorCamera}
                description="video와 overlay를 함께 좌우반전합니다. 분석 좌표와 기준값은 뒤집지 않습니다."
                id="settings-camera-mirror"
                label="카메라 좌우반전"
                onCheckedChange={setMirrorCamera}
              />
              <div className="flex min-h-16 flex-col justify-center gap-1 py-3">
                <p className="text-sm font-medium">선택 카메라 장치</p>
                <p className="break-all font-mono text-xs text-muted-foreground">
                  {selectedCameraDeviceId ?? '카메라 권한 승인 후 선택할 수 있습니다.'}
                </p>
              </div>
              <Alert>
                <Info aria-hidden="true" />
                <AlertTitle>카메라를 켜기 전에는 권한을 요청하지 않습니다.</AlertTitle>
                <AlertDescription>아래 미리보기에서 장치를 선택하고 실제 overlay와 캘리브레이션을 확인할 수 있습니다.</AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <CameraPanel />

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">파일럿 Pose 모델</CardTitle>
                <Badge className="gap-1.5" variant="secondary">
                  <Sparkles aria-hidden="true" className="size-3.5" />
                  정적 자산만 배치
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border bg-slate-950 p-4 font-mono text-xs text-slate-200">
                public/models/tm-pose/
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {['GOOD_POSTURE', 'FORWARD_LEAN', 'SIDE_LEAN', 'RESTING'].map((label) => (
                  <div className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm" key={label}>
                    <Check aria-hidden="true" className="size-4 text-emerald-600" />
                    <code>{label}</code>
                  </div>
                ))}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                모델 파일은 배포 자산에 포함되지만 Phase 3 전까지 어떤 코드에서도 로드하거나 추론하지 않습니다.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">조도 기준</CardTitle>
                <Badge variant="outline">프로젝트 기본값</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  ['어두움', '300 미만'],
                  ['권장 최소', '500 Lux'],
                  ['권장 최대', '700 Lux'],
                  ['과도한 밝기', '1000 초과'],
                ].map(([label, value]) => (
                  <div className="rounded-xl border bg-muted/25 p-4" key={label}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-1 font-mono text-sm font-semibold">{value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                <Lightbulb aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                실제 하드웨어나 의료 기준이 아닌 가상 센서 시뮬레이션용 범위입니다.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="mt-5 space-y-5" value="privacy">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">알림</CardTitle>
                <Badge variant="outline">Phase 4 예정</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {['자세 경고음', '조도 경고음', 'Toast 알림', '경고 쿨다운'].map((item) => (
                <div className="flex min-h-14 items-center justify-between rounded-xl border px-4" key={item}>
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BellRing aria-hidden="true" className="size-4" />
                    {item}
                  </span>
                  <Switch aria-label={`${item} — Phase 4 예정`} disabled />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">개인정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <Alert className="border-emerald-200 bg-emerald-50 text-emerald-950">
                <LockKeyhole aria-hidden="true" />
                <AlertTitle>원본 영상과 이미지를 저장하지 않습니다.</AlertTitle>
                <AlertDescription>
                  카메라 영상은 향후에도 브라우저 안의 실시간 분석에만 사용하며 서버로 전송하지 않습니다.
                </AlertDescription>
              </Alert>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <EyeOff aria-hidden="true" className="size-5 text-primary" />
                  <p className="mt-3 text-sm font-semibold">저장하지 않는 정보</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">영상, 이미지 프레임, 얼굴 사진, 음성</p>
                </div>
                <div className="rounded-xl border p-4">
                  <ShieldCheck aria-hidden="true" className="size-5 text-emerald-600" />
                  <p className="mt-3 text-sm font-semibold">Phase 1 저장 정보</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">이 브라우저의 표시 설정, 과목, 목표 시간</p>
                </div>
              </div>

              <Separator />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">현재 세션 초기화</p>
                  <p className="mt-1 text-xs text-muted-foreground">메모리에 누적된 Phase 1 타이머만 0으로 되돌립니다.</p>
                </div>
                <Button className="min-h-11" onClick={resetSession} variant="outline">세션 초기화</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
