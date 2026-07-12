# studylog Phase 2 — MediaPipe·웹캠·캘리브레이션 구현 지시서

## 0. 작업 시작 전 반드시 지킬 원칙

너는 `studylog` 프로젝트의 Phase 2를 구현하는 시니어 프론트엔드·브라우저 AI 개발자다.

현재 Phase 1은 다음 상태로 완료되어 있다.

- React 19
- TypeScript strict
- Vite 8
- Tailwind CSS + shadcn/ui
- React Router 라우트
- PC 사이드바·모바일 하단 내비게이션
- Mock GOOD/BAD/AWAY 자세 제어
- Mock Lux 슬라이더와 조도 상태
- delta 기반 순공·상세 시간 타이머
- 자리 비움 시간 기본 숨김 및 설정 연동
- 기록 Empty State
- 정적 그룹 페이지
- 그룹 관련 액션 6개 모두 disabled
- Vercel SPA rewrite
- 기존 테스트 35개 통과
- lint 경고 0개
- production build 통과
- 파일럿 Teachable Machine Pose 모델 3개 파일은 `public/models/tm-pose/`에 있지만 아직 런타임에서 로드하지 않음

이번 작업에서는 **Phase 2만** 구현한다.

Phase 3인 Teachable Machine Pose 모델 런타임 연동, Phase 4인 AI 결과 융합·상태 안정화·자동 타이머 제어는 시작하지 않는다.

작업 전 반드시 다음을 수행한다.

1. `docs/PROJECT_BRIEF.md`를 끝까지 읽는다.
2. `AGENTS.md`를 읽는다.
3. 현재 Phase 1 코드 구조를 조사한다.
4. `TodayPage.tsx`, `StudyStateMachine.ts`, `SessionTimer.ts`, 설정 store, Mock 자세 제어 경로를 확인한다.
5. 기존 구조를 무시하고 새 앱을 만들지 않는다.
6. 구현 계획, 변경 파일 목록, 설치 패키지, 위험 요소, 완료 기준을 먼저 보고한다.
7. 사용자의 확인 없이 Phase 3을 시작하지 않는다.

이번 Phase의 핵심 원칙은 다음과 같다.

- 카메라는 사용자가 버튼을 눌렀을 때만 켠다.
- 한 번에 `MediaStream` 하나만 만든다.
- MediaPipe와 향후 Teachable Machine은 같은 `HTMLVideoElement`를 공유한다.
- 원본 영상·이미지·프레임을 저장하거나 서버로 전송하지 않는다.
- 현재 Phase에서 MediaPipe 결과로 순공 타이머를 자동 제어하지 않는다.
- 기존 Mock GOOD/BAD/AWAY 제어는 비상 데모와 회귀 테스트를 위해 유지한다.
- 그룹 페이지는 그대로 정적 더미 UI다.
- 로그인, DB, Supabase, Firebase, API, WebSocket을 추가하지 않는다.
- 의료 진단, 거북목 진단, 집중력 측정이라고 표현하지 않는다.

---

# 1. Phase 2 목표

이번 Phase의 목표는 실제 브라우저 웹캠과 MediaPipe Pose Landmarker를 studylog 웹 앱에 연결하는 것이다.

최종 사용 흐름은 다음과 같다.

```text
사용자가 카메라 켜기 클릭
→ 브라우저 카메라 권한 요청
→ 하나의 MediaStream 생성
→ video element에 연결
→ MediaPipe Pose Landmarker Lite 초기화
→ 실시간 관절 랜드마크 검출
→ video 위 canvas에 관절점·연결선 표시
→ 사람 존재 여부 표시
→ 사용자가 기준 자세 등록 선택
→ 3초 카운트다운
→ 2.5초 동안 자세 특징 수집
→ 특징별 중앙값으로 기준 자세 저장
→ 현재 자세와 기준 자세의 상대적 편차 계산
→ 편차를 UI의 정보·디버그 데이터로 표시
```

Phase 2가 끝나도 다음은 기존 Mock 제어로만 동작해야 한다.

- 순공 타이머
- 자세 주의 타이머
- 자리 비움 타이머
- GOOD/BAD/AWAY 사용자 상태

실제 MediaPipe 결과를 타이머·StudyStateMachine에 연결하는 것은 Phase 4다.

---

# 2. 이번 Phase의 구현 범위

반드시 구현한다.

1. 사용자 동작 기반 카메라 권한 요청
2. 단일 MediaStream 관리
3. 카메라 장치 목록 조회
4. 카메라 장치 변경
5. 카메라 좌우반전 설정
6. 카메라 중지 및 자원 정리
7. MediaPipe Pose Landmarker Lite 초기화
8. VIDEO 모드 실시간 검출
9. 사람 한 명의 33개 관절 랜드마크 처리
10. 웹캠 위 관절점·연결선 오버레이
11. 사람 존재 여부 원시 표시
12. 기준 자세 캘리브레이션
13. 자세 특징 추출
14. 기준 자세와 현재 자세 편차 계산
15. 카메라·AI 상태 UI
16. 권한·장치·모델 오류별 한국어 UI
17. 모바일·데스크톱 반응형 카메라 UI
18. 기존 설정 페이지와 카메라 옵션 연동
19. Mock 모드 유지
20. 관련 단위 테스트
21. README 갱신
22. Vercel Preview에서 실제 카메라 검증

이번 Phase에서는 구현하지 않는다.

- Teachable Machine Pose 모델 로딩
- TensorFlow.js 런타임 연결
- `public/models/tm-pose/` 파일 사용
- TM 클래스 확률 표시
- MediaPipe와 TM 결과 융합
- 실측 자세로 GOOD/BAD/AWAY 확정
- 실측 자세로 순공 타이머 자동 제어
- 실제 자리 비움 자동 일시정지
- 자세 경고 15초·쿨다운 120초 로직
- IndexedDB 세션 로그 완성
- 리포트 완성
- Python 분석
- PWA 완성
- 실제 그룹 기능

---

# 3. Git·브랜치 작업

Phase 1 PR이 아직 main에 병합되지 않았다면 먼저 다음을 수행한다.

```text
Phase 1 Draft PR 확인
→ Ready for review 전환
→ main에 Squash and merge
→ 최신 main fetch/pull
```

최신 main에서 새 브랜치를 만든다.

```text
agent/studylog-phase-2-mediapipe
```

Phase 1 브랜치에 계속 커밋하지 않는다.

Phase 2 완료 후 Draft PR을 생성한다.

---

# 4. 패키지 및 자산

## 4.1 MediaPipe 패키지

NPM 패키지를 사용한다.

```bash
npm install @mediapipe/tasks-vision
```

조건:

- CDN script tag를 사용하지 않는다.
- 실제 lint, test, build를 통과한 정확한 버전을 lockfile에 고정한다.
- 기존 `package.json` script를 삭제하거나 덮어쓰지 않는다.
- React 19, Vite 8, TypeScript strict와 충돌하지 않는지 검증한다.

## 4.2 WASM 자산

`node_modules/@mediapipe/tasks-vision/wasm` 내부 파일 전체를 이름 변경 없이 아래로 복사한다.

```text
public/mediapipe/wasm/
```

수동 복사만 하지 말고 Node.js 복사 스크립트를 만든다.

권장 파일:

```text
scripts/sync-mediapipe-assets.mjs
```

스크립트 책임:

1. 원본 WASM 폴더 존재 확인
2. 대상 폴더 생성
3. 재귀 복사
4. 파일명 보존
5. Windows·Linux 경로 지원
6. 실패 시 명확한 오류
7. Vercel npm install 이후에도 실행 가능

`postinstall` 또는 기존 환경에 적합한 lifecycle script에 연결한다.

## 4.3 Pose Landmarker 모델

Google AI Edge 공식 Pose Landmarker Lite `.task` 모델을 사용한다.

프로젝트 경로:

```text
public/models/mediapipe/pose_landmarker_lite.task
```

조건:

- Lite 모델만 사용한다.
- 제3자 블로그·임의 저장소 모델을 사용하지 않는다.
- 모델 출처와 역할을 README에 기록한다.
- 공식 모델 확보가 실패하면 임의 대체 모델을 쓰지 말고 보고한다.

다음 파일과 혼동하지 않는다.

```text
public/models/tm-pose/
├─ model.json
├─ metadata.json
└─ weights.bin
```

TM Pose 파일은 Phase 2에서 로드하지 않는다.

---

# 5. 아키텍처 원칙

현재 프로젝트 구조를 조사한 뒤 책임을 유지하면서 통합한다.

권장 구조:

```text
src/
├─ camera/
│  ├─ CameraManager.ts
│  ├─ camera-errors.ts
│  ├─ camera-types.ts
│  └─ camera-config.ts
│
├─ ai/
│  ├─ MediaPipePoseEngine.ts
│  ├─ PoseFeatureExtractor.ts
│  ├─ CalibrationManager.ts
│  ├─ PostureDeviationAnalyzer.ts
│  ├─ pose-landmark-index.ts
│  ├─ pose-config.ts
│  └─ pose-types.ts
│
├─ hooks/
│  ├─ useCamera.ts
│  └─ usePoseRuntime.ts
│
├─ components/camera/
│  ├─ CameraPanel.tsx
│  ├─ PoseOverlayCanvas.tsx
│  ├─ CameraControlBar.tsx
│  ├─ CameraErrorState.tsx
│  ├─ CalibrationDialog.tsx
│  ├─ CalibrationProgress.tsx
│  └─ PoseDebugPanel.tsx
```

현재 폴더 규칙이 다르면 그대로 따르되 책임은 분리한다.

금지:

- `TodayPage.tsx` 안에 getUserMedia·MediaPipe·캘리브레이션 전부 작성
- UI 컴포넌트에서 `navigator.mediaDevices` 직접 호출
- UI 컴포넌트에서 PoseLandmarker 직접 생성
- MediaPipe 원본 result 객체를 Zustand에 통째로 저장
- MediaStream을 Zustand·localStorage·IndexedDB에 저장
- 관절 좌표를 매 프레임 React state에 넣어 전체 앱 재렌더링

권장:

- stream과 engine 인스턴스는 `ref` 또는 클래스 인스턴스로 보관
- store에는 상태·장치 ID·설정·요약 데이터만 저장
- overlay는 canvas에 직접 그려 React 렌더링과 분리
- 클래스는 브라우저 API와 MediaPipe를 감싸고, hook은 React 생명주기와 연결

---

# 6. 타입 정의

## 6.1 카메라 상태

```ts
export type CameraStatus =
  | "IDLE"
  | "REQUESTING_PERMISSION"
  | "STARTING"
  | "READY"
  | "STOPPING"
  | "STOPPED"
  | "ERROR";
```

설명:

- `IDLE`: 아직 카메라를 요청하지 않음
- `REQUESTING_PERMISSION`: 브라우저 권한 응답 대기
- `STARTING`: stream을 video에 연결하고 metadata를 기다리는 중
- `READY`: video frame을 사용할 수 있음
- `STOPPING`: track 정리 중
- `STOPPED`: 사용자가 카메라를 정상 종료함
- `ERROR`: 카메라 사용 실패

카메라 상태와 세션 생명주기 상태를 섞지 않는다.

## 6.2 카메라 오류 코드

```ts
export type CameraErrorCode =
  | "PERMISSION_DENIED"
  | "DEVICE_NOT_FOUND"
  | "DEVICE_BUSY"
  | "CONSTRAINT_UNSUPPORTED"
  | "INSECURE_CONTEXT"
  | "MEDIA_DEVICES_UNSUPPORTED"
  | "STREAM_INTERRUPTED"
  | "UNKNOWN";

export interface CameraErrorInfo {
  code: CameraErrorCode;
  title: string;
  message: string;
  recoverable: boolean;
  originalName?: string;
}
```

## 6.3 카메라 장치

```ts
export interface CameraDeviceOption {
  deviceId: string;
  label: string;
  groupId?: string;
  isSelected: boolean;
}
```

## 6.4 Pose 엔진 상태

```ts
export type PoseEngineStatus =
  | "IDLE"
  | "LOADING_ASSETS"
  | "INITIALIZING"
  | "READY"
  | "RUNNING"
  | "PAUSED"
  | "ERROR"
  | "DISPOSED";
```

설명:

- `IDLE`: 초기화 전
- `LOADING_ASSETS`: WASM·모델 자산 준비
- `INITIALIZING`: PoseLandmarker 생성 중
- `READY`: 추론 가능
- `RUNNING`: 프레임 분석 중
- `PAUSED`: 카메라 중지·탭 비활성 등으로 일시정지
- `ERROR`: 모델·WASM·추론 오류
- `DISPOSED`: 자원 정리 완료

## 6.5 사람 검출 표시 상태

Phase 2에서는 사용자용 AWAY 상태를 확정하지 않고 원시 감지 상태만 제공한다.

```ts
export type PosePresenceStatus =
  | "UNKNOWN"
  | "DETECTED"
  | "TEMPORARILY_MISSING"
  | "MISSING";
```

초기 의미:

- `UNKNOWN`: 아직 충분한 프레임이 없음
- `DETECTED`: 유효한 사람 관절 검출
- `TEMPORARILY_MISSING`: 순간적으로 관절이 사라짐
- `MISSING`: 일정 시간 유효 포즈가 없음

중요:

- Phase 2에서는 `MISSING`을 기존 StudyStateMachine의 AWAY로 연결하지 않는다.
- UI에 “사람 감지됨”, “사람을 찾는 중” 정도만 표시한다.

## 6.6 자체 랜드마크 타입

MediaPipe 라이브러리 타입을 앱 전체에 노출하지 않는다.

```ts
export interface NormalizedPoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number | null;
  presence: number | null;
}

export interface WorldPoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number | null;
  presence: number | null;
}
```

## 6.7 프레임 결과

```ts
export interface PoseFrameResult {
  timestampMs: number;
  detected: boolean;
  landmarks: NormalizedPoseLandmark[];
  worldLandmarks: WorldPoseLandmark[] | null;
  inferenceMs: number;
  sourceWidth: number;
  sourceHeight: number;
  validLandmarkCount: number;
}
```

원본 영상과 원본 MediaPipe result 객체는 저장하지 않는다.

## 6.8 자세 특징

```ts
export interface PostureFeatures {
  shoulderWidth: number;
  noseToShoulderVerticalRatio: number;
  shoulderTiltRatio: number;
  headHorizontalOffsetRatio: number;
  faceScaleRatio: number | null;
  leftWristToFaceRatio: number | null;
  rightWristToFaceRatio: number | null;
}
```

## 6.9 캘리브레이션 상태

```ts
export type CalibrationStatus =
  | "NOT_CALIBRATED"
  | "READY_TO_START"
  | "COUNTDOWN"
  | "COLLECTING"
  | "PROCESSING"
  | "CALIBRATED"
  | "FAILED"
  | "CANCELLED";
```

## 6.10 캘리브레이션 프로필

```ts
export interface CalibrationProfile {
  id: string;
  version: 1;
  createdAt: string;
  cameraDeviceId: string | null;
  sampleCount: number;
  baseline: {
    noseToShoulderVerticalRatio: number;
    shoulderTiltRatio: number;
    headHorizontalOffsetRatio: number;
    faceScaleRatio: number | null;
  };
  quality: {
    validSampleRatio: number;
    movementScore: number;
  };
}
```

`mirrorCamera`는 Phase 2에서 **표시용 transform**으로만 사용한다.

MediaPipe와 향후 TM은 동일한 원본 video frame을 입력으로 사용한다.

따라서 display mirror 변경만으로 수치 좌표를 두 번 뒤집지 않는다.

## 6.11 편차 사유와 결과

```ts
export type DeviationReason =
  | "FACE_MOVED_CLOSER"
  | "HEAD_DROPPED"
  | "SHOULDER_TILTED"
  | "BODY_SHIFTED";

export interface PostureDeviation {
  score: number;
  level: "LOW" | "MEDIUM" | "HIGH";
  reasons: DeviationReason[];
  metrics: {
    faceScaleDelta: number | null;
    headDropDelta: number;
    shoulderTiltDelta: number;
    horizontalOffsetDelta: number;
  };
}
```

이 결과는 Phase 2에서 정보·디버그 표시용이다.

`HIGH`라고 해서 BAD 타이머를 작동시키지 않는다.

## 6.12 런타임 스냅샷

```ts
export interface PoseRuntimeSnapshot {
  cameraStatus: CameraStatus;
  engineStatus: PoseEngineStatus;
  presenceStatus: PosePresenceStatus;
  latestFrame: PoseFrameResult | null;
  features: PostureFeatures | null;
  calibration: CalibrationProfile | null;
  calibrationStatus: CalibrationStatus;
  deviation: PostureDeviation | null;
  inferenceHz: number;
  averageInferenceMs: number;
  error: CameraErrorInfo | null;
}
```

UI에는 필요한 필드만 선택적으로 전달한다.

---

# 7. 카메라 상태 전이

카메라 상태 머신을 명확히 구현한다.

```text
IDLE
  └─ 사용자가 카메라 켜기 클릭
      → REQUESTING_PERMISSION
          ├─ 권한 승인
          │   → STARTING
          │       ├─ video metadata 준비
          │       │   → READY
          │       └─ 실패
          │           → ERROR
          └─ 권한 거부
              → ERROR

READY
  ├─ 카메라 끄기
  │   → STOPPING → STOPPED
  ├─ 장치 변경
  │   → STOPPING → STARTING → READY
  ├─ stream 중단
  │   → ERROR
  └─ 페이지 이탈
      → STOPPING → STOPPED

ERROR
  ├─ 다시 시도
  │   → REQUESTING_PERMISSION 또는 STARTING
  └─ 카메라 없이 데모
      → 기존 Mock 모드 유지
```

불가능하거나 모순된 전이는 무시하거나 개발 로그를 남긴다.

---

# 8. CameraManager

다음 API를 가진 클래스를 구현한다.

```ts
export class CameraManager {
  async requestPermission(
    preferredDeviceId?: string
  ): Promise<MediaStream>;

  async start(
    videoElement: HTMLVideoElement,
    preferredDeviceId?: string
  ): Promise<MediaStream>;

  async listDevices(): Promise<CameraDeviceOption[]>;

  async switchDevice(
    videoElement: HTMLVideoElement,
    deviceId: string
  ): Promise<MediaStream>;

  stop(): void;

  getStream(): MediaStream | null;

  getCurrentDeviceId(): string | null;

  isActive(): boolean;
}
```

필수 동작:

1. 사용자가 `카메라 켜기` 버튼을 눌렀을 때만 권한 요청
2. 페이지 진입 시 자동 권한 요청 금지
3. video만 요청하고 audio는 false
4. 하나의 stream만 생성
5. 중복 start 시 기존 활성 stream 재사용 또는 명확히 방지
6. 장치 변경 시 기존 모든 video track stop
7. stop 시 모든 track stop
8. `video.srcObject = null` 정리
9. 현재 deviceId 저장
10. 권한 승인 후 장치 목록 재조회
11. 이전 선택 장치가 있으면 우선 시도
12. 존재하지 않는 장치 ID면 기본 카메라 fallback
13. 카메라 없이 Mock 앱 사용 가능
14. stream track의 `ended` 이벤트 처리
15. `devicechange` 이벤트 대응
16. 컴포넌트 unmount·라우트 이탈 시 정리
17. 개발 StrictMode의 setup→cleanup→setup에도 중복 stream이 남지 않음

초기 constraints:

```ts
const DEFAULT_CAMERA_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  frameRate: { ideal: 30, max: 30 },
  facingMode: { ideal: "user" },
};
```

특정 deviceId가 있으면 `deviceId: { exact: id }`를 우선 사용하되 실패 시 기본 constraints로 한 번 fallback한다.

---

# 9. 카메라 오류 변환

브라우저 오류명을 사용자용 오류로 변환하는 순수 함수를 구현한다.

```ts
export function mapCameraError(error: unknown): CameraErrorInfo;
```

매핑:

```text
NotAllowedError
→ PERMISSION_DENIED
→ “카메라 권한이 거부되었습니다.”

NotFoundError
→ DEVICE_NOT_FOUND
→ “사용할 수 있는 카메라를 찾지 못했습니다.”

NotReadableError
→ DEVICE_BUSY
→ “다른 프로그램에서 카메라를 사용 중일 수 있습니다.”

OverconstrainedError
→ CONSTRAINT_UNSUPPORTED
→ “요청한 카메라 설정을 지원하지 않습니다.”

SecurityError
→ INSECURE_CONTEXT
→ “현재 환경에서는 카메라에 접근할 수 없습니다.”

navigator.mediaDevices 없음
→ MEDIA_DEVICES_UNSUPPORTED
→ “이 브라우저는 카메라 기능을 지원하지 않습니다.”

기타
→ UNKNOWN
→ “카메라를 시작하지 못했습니다.”
```

사용자 UI에는 raw stack trace를 노출하지 않는다.

---

# 10. MediaPipePoseEngine

다음 API를 가진 클래스를 구현한다.

```ts
export class MediaPipePoseEngine {
  async initialize(): Promise<void>;

  detect(
    video: HTMLVideoElement,
    timestampMs: number
  ): PoseFrameResult;

  isReady(): boolean;

  getStatus(): PoseEngineStatus;

  dispose(): void;
}
```

초기 설정:

```ts
{
  runningMode: "VIDEO",
  numPoses: 1,
  minPoseDetectionConfidence: 0.5,
  minPosePresenceConfidence: 0.5,
  minTrackingConfidence: 0.5,
  outputSegmentationMasks: false
}
```

경로:

```text
WASM: /mediapipe/wasm
모델: /models/mediapipe/pose_landmarker_lite.task
```

초기화:

1. `FilesetResolver.forVisionTasks()` 실행
2. GPU delegate 우선 시도 가능
3. GPU 실패 시 CPU로 한 번 fallback
4. initialize Promise 캐시
5. 동시 initialize 중복 방지
6. 모델 404·WASM 404를 구분해 로깅
7. dispose 후 재초기화 가능

주의:

- Phase 2에서는 segmentation mask를 사용하지 않는다.
- `PoseLandmarker` 원본 결과를 외부에 그대로 반환하지 않는다.
- 자체 `PoseFrameResult`로 매핑한다.

---

# 11. 추론 루프

MediaPipe `detectForVideo`를 매 화면 프레임마다 호출하지 않는다.

목표 추론 속도:

```text
6~8Hz
```

권장 간격:

```text
125~160ms
```

구현 조건:

1. `requestAnimationFrame` 기반 루프
2. `performance.now()` 사용
3. 마지막 추론 시간으로 throttle
4. `video.currentTime`이 이전과 같으면 건너뜀
5. `video.readyState` 확인
6. videoWidth·videoHeight가 0이면 건너뜀
7. pose engine READY 확인
8. 카메라 READY 확인
9. `inferenceInFlight` guard
10. 동시에 두 detect 호출 금지
11. timestamp는 단조 증가
12. 탭 hidden 시 추론 일시정지 또는 크게 감소
13. 카메라 OFF 시 추론 종료
14. unmount 시 rAF 취소
15. 오류 발생 시 무한 재시도 루프 금지

이번 Phase에서는 Web Worker를 구현하지 않는다.

실제 UI 멈춤이 확인될 때 후속 최적화로 검토한다.

---

# 12. 랜드마크 인덱스 상수

매직 넘버를 코드 여러 곳에 쓰지 않는다.

```ts
export const POSE_LANDMARK_INDEX = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
} as const;
```

Phase 2의 상반신 분석은 코·귀·어깨·팔꿈치·손목 위주로 사용한다.

---

# 13. 사람 검출 유효성

단순히 `landmarks.length > 0`만 사용하지 않는다.

유효 포즈 조건:

1. landmarks 33개 존재
2. NOSE 존재
3. LEFT_SHOULDER 존재
4. RIGHT_SHOULDER 존재
5. 필수 랜드마크 visibility/presence가 설정 기준 이상
6. 어깨 너비가 최소값 이상
7. NaN·Infinity 좌표 없음

설정값은 `pose-config.ts`에 모은다.

예시:

```ts
export const POSE_VALIDATION_CONFIG = {
  minVisibility: 0.5,
  minPresence: 0.5,
  minShoulderWidth: 0.05,
};
```

환경에 따라 visibility 또는 presence가 null일 수 있으므로 안전하게 처리한다.

Phase 2 존재 상태 예시:

```text
유효 포즈 검출
→ DETECTED

0~0.8초 유효 포즈 없음
→ TEMPORARILY_MISSING

0.8초 이상 유효 포즈 없음
→ MISSING
```

위 수치는 UI 상태 표시용이며 AWAY 타이머와 연결하지 않는다.

---

# 14. PoseFeatureExtractor

```ts
export class PoseFeatureExtractor {
  extract(result: PoseFrameResult): PostureFeatures | null;
}
```

필수 계산:

```text
shoulderCenter
= 양쪽 어깨의 평균 좌표

shoulderWidth
= 양쪽 어깨의 2D 거리

noseToShoulderVerticalRatio
= (shoulderCenter.y - nose.y) / shoulderWidth

shoulderTiltRatio
= abs(leftShoulder.y - rightShoulder.y) / shoulderWidth

headHorizontalOffsetRatio
= abs(nose.x - shoulderCenter.x) / shoulderWidth
```

`faceScaleRatio`:

- 양쪽 귀 visibility가 충분하면 귀 사이 거리 / 어깨 너비
- 귀가 불충분하면 양쪽 눈 바깥점 사용을 검토
- 계산 불가하면 null

손목 특징:

```text
leftWristToFaceRatio
rightWristToFaceRatio
```

- 손목과 코 사이 거리 / 어깨 너비
- visibility 부족 시 null

규칙:

- 모든 길이는 어깨 너비로 정규화
- 어깨 너비가 너무 작으면 null
- 계산 불가값을 0으로 대체하지 않음
- NaN·Infinity 방지
- 순수 함수에 가깝게 구현

---

# 15. 캘리브레이션 상태 전이

```text
NOT_CALIBRATED
  └─ 카메라·엔진 준비
      → READY_TO_START

READY_TO_START
  └─ 기준 자세 등록 클릭
      → COUNTDOWN

COUNTDOWN
  ├─ 3초 완료
  │   → COLLECTING
  └─ 취소
      → CANCELLED

COLLECTING
  ├─ 2.5초 완료 + 충분한 유효 샘플
  │   → PROCESSING
  ├─ 샘플 부족
  │   → FAILED
  └─ 취소
      → CANCELLED

PROCESSING
  ├─ 프로필 생성 성공
  │   → CALIBRATED
  └─ 품질 불량
      → FAILED
```

캘리브레이션 실패는 앱 전체 오류가 아니다.

다시 시도할 수 있어야 한다.

---

# 16. CalibrationManager

```ts
export class CalibrationManager {
  start(): void;
  cancel(): void;
  addSample(features: PostureFeatures, timestampMs: number): void;
  canFinish(): boolean;
  finish(context: CalibrationContext): CalibrationProfile;
  reset(): void;
  getStatus(): CalibrationStatus;
  getProgress(): number;
}
```

캘리브레이션 UX:

```text
1. 안내 다이얼로그
2. 3초 카운트다운
3. 2.5초 수집
4. 유효 프레임만 저장
5. 중앙값 계산
6. 품질 확인
7. localStorage 저장
8. 완료 Toast
```

안내 문구:

```text
평소 공부할 때의 편안하고 안정적인 자세를 취해 주세요.
이 기능은 의료적인 자세 진단이 아니라 현재 자세와 등록한 기준 자세를 비교하기 위한 기능입니다.
```

초기 목표:

- MediaPipe 6~8Hz 기준 유효 샘플 최소 12개
- 권장 15개 이상
- 샘플 수·유효 비율·움직임 정도 기록

---

# 17. 중앙값·품질 계산

순수 함수로 분리하고 테스트한다.

```ts
export function median(values: number[]): number;
export function medianAbsoluteDeviation(values: number[]): number;
```

규칙:

- 빈 배열이면 의미 있는 오류
- null 값은 해당 특징 계산에서 제외
- faceScale 유효값 부족 시 baseline null
- 단일 프레임을 기준값으로 사용하지 않음
- 단순 마지막 프레임 사용 금지

캘리브레이션 품질:

```ts
export interface CalibrationQuality {
  validSampleRatio: number;
  movementScore: number;
  acceptable: boolean;
  warnings: string[];
}
```

움직임이 지나치게 크면 다음 안내:

```text
기준 자세를 등록하는 동안 움직임이 많았습니다.
편안한 자세를 유지한 뒤 다시 시도해 주세요.
```

---

# 18. CalibrationProfile 저장

기존 설정 repository/store를 조사해 통합한다.

localStorage key는 버전이 드러나게 한다.

예:

```text
studylog:calibration:v1
```

저장 데이터에는 다음을 포함하지 않는다.

- 이미지
- 영상
- 원본 관절 배열
- 얼굴 정보

저장하는 것:

- 기준 특징값
- 생성 시각
- 카메라 deviceId
- 샘플 수
- 품질 정보
- 버전

카메라 장치가 바뀌면 프로필을 자동 삭제하지 않고 “기준 자세를 다시 등록하는 것을 권장합니다” 안내를 표시한다.

`mirrorCamera`는 display-only 정책이므로 좌우반전만 바뀐 경우 수치 프로필을 자동 폐기하지 않는다.

---

# 19. PostureDeviationAnalyzer

```ts
export class PostureDeviationAnalyzer {
  analyze(
    current: PostureFeatures,
    calibration: CalibrationProfile
  ): PostureDeviation;
}
```

초기 편차:

```text
headDropDelta
= baseline noseToShoulderVerticalRatio - current value

shoulderTiltDelta
= current shoulderTiltRatio - baseline value

horizontalOffsetDelta
= current headHorizontalOffsetRatio - baseline value

faceScaleDelta
= current faceScaleRatio / baseline faceScaleRatio - 1
```

각 값은 안전하게 clamp한다.

초기 사유:

- `FACE_MOVED_CLOSER`
- `HEAD_DROPPED`
- `SHOULDER_TILTED`
- `BODY_SHIFTED`

초기 설정은 한 파일에 모은다.

```ts
export const DEVIATION_THRESHOLDS = {
  faceScaleDelta: 0.2,
  headDropDelta: 0.15,
  shoulderTiltDelta: 0.12,
  horizontalOffsetDelta: 0.2,
};
```

위 숫자는 의료 기준이 아니라 초기 프로토타입값이다.

여러 파일에 하드코딩하지 않는다.

점수 예시:

```text
각 delta / threshold를 0~1로 정규화
→ 가중 평균
→ score 0~1
```

초기 가중치 예시:

```ts
export const DEVIATION_WEIGHTS = {
  faceScale: 0.25,
  headDrop: 0.35,
  shoulderTilt: 0.2,
  horizontalOffset: 0.2,
};
```

faceScale이 null이면 남은 가중치를 재정규화한다.

레벨:

```text
0.00~0.34 → LOW
0.35~0.64 → MEDIUM
0.65~1.00 → HIGH
```

중요:

- Phase 2에서는 LOW/MEDIUM/HIGH를 타이머 제어에 사용하지 않는다.
- 디버그·정보 UI에만 표시한다.
- Phase 4에서 TM 결과와 융합해 사용한다.

---

# 20. 좌우반전 정책

`mirrorCamera`는 사용자 화면 표시용이다.

정책:

- video 표시: 필요 시 CSS `scaleX(-1)`
- overlay canvas 표시: video와 동일하게 CSS `scaleX(-1)`
- MediaPipe 입력: 원본 unmirrored video
- 수치 랜드마크: unmirrored 좌표
- 캘리브레이션: unmirrored 좌표
- 향후 TM 입력: 동일 원본 video 또는 명시적으로 동일 정책 적용

금지:

- video를 CSS로 뒤집고 랜드마크 x 좌표도 다시 뒤집어 이중 반전
- overlay만 반전
- 설정 변경 시 여러 컴포넌트에 서로 다른 mirror 값 사용

하나의 settings 값만 사용한다.

---

# 21. 관절 오버레이 좌표 매핑

video와 canvas는 같은 wrapper 안에 겹친다.

권장:

```text
wrapper: position relative
video: absolute/in-flow
canvas: absolute inset-0 pointer-events-none
```

video 표시에는 `object-fit: contain`을 우선 사용한다.

원본 비율과 컨테이너 비율이 다르면 letterbox offset을 계산한다.

순수 함수:

```ts
export interface ContainTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
  renderedWidth: number;
  renderedHeight: number;
}

export function computeContainTransform(
  sourceWidth: number,
  sourceHeight: number,
  containerWidth: number,
  containerHeight: number
): ContainTransform;
```

랜드마크 매핑:

```text
pixelX = offsetX + normalizedX * renderedWidth
pixelY = offsetY + normalizedY * renderedHeight
```

조건:

- ResizeObserver로 wrapper 크기 감지
- devicePixelRatio 반영
- canvas backing store 크기와 CSS 크기 구분
- canvas를 매 프레임 새로 만들지 않음
- 화면 회전·창 크기 변경 대응
- 사람 미검출 시 이전 skeleton 제거
- 낮은 visibility landmark는 숨기거나 흐리게 표시

연결선은 MediaPipe의 pose connections를 사용해도 된다.

디자인:

- studylog 인디고·에메랄드 계열
- 선 두께 과도하지 않음
- 영상 가리지 않음
- 정상·불량 판정 색으로 바꾸지 않음. Phase 2는 판정 단계가 아니다.

---

# 22. React hook 구조

## useCamera

책임:

- CameraManager 인스턴스 연결
- CameraStatus 노출
- 장치 목록 노출
- start/stop/switchDevice
- 오류 노출
- cleanup

예시 반환:

```ts
interface UseCameraResult {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  devices: CameraDeviceOption[];
  selectedDeviceId: string | null;
  error: CameraErrorInfo | null;
  start: () => Promise<void>;
  stop: () => void;
  switchDevice: (deviceId: string) => Promise<void>;
  retry: () => Promise<void>;
}
```

## usePoseRuntime

책임:

- MediaPipe engine lifecycle
- 추론 루프
- 최신 결과 ref
- overlay callback
- 특징 추출
- 존재 상태
- 캘리브레이션 연결
- 편차 계산
- cleanup

React state 업데이트는 UI가 필요한 주기로 제한한다.

매 프레임 landmarks 전체를 state에 넣지 않는다.

---

# 23. UI 구성

기존 TodayPage 레이아웃과 shadcn 디자인을 유지한다.

## 카메라 OFF

표시:

- 카메라 아이콘
- “카메라를 켜고 자세 분석을 시작하세요”
- 개인정보 안내
- `카메라 켜기` 버튼
- `카메라 없이 데모 계속하기` 버튼

개인정보 문구:

```text
카메라 영상은 현재 브라우저 안에서 실시간 자세 분석에만 사용됩니다.
원본 영상과 이미지는 저장되거나 서버로 전송되지 않습니다.
```

## 카메라 ON

표시:

- video
- overlay canvas
- 카메라 상태 Badge
- AI 상태 Badge
- 사람 감지 Badge
- 관절 표시 Switch
- 좌우반전 Switch
- 카메라 선택 Select
- 기준 자세 등록 Button
- 카메라 끄기 Button

## 캘리브레이션

shadcn Dialog 또는 모바일 Drawer를 사용한다.

화면:

```text
기준 자세 등록
3 → 2 → 1
기준 자세를 유지해 주세요
수집 진행률
유효 샘플 수
완료 또는 재시도
```

## 고급 정보

기본 UI를 복잡하게 하지 말고 `자세 분석 정보` Collapsible 또는 `?debug=true`에서 표시한다.

표시 가능 정보:

- engine status
- inference Hz
- 평균 inference ms
- pose detected
- valid landmark count
- calibration sample count
- deviation score
- deviation reasons
- 현재 특징값

---

# 24. 모바일 UI

360px 폭에서 가로 overflow가 없어야 한다.

요구사항:

- 카메라 wrapper aspect ratio 유지
- 카메라 카드는 접기 가능
- 컨트롤은 2열 또는 세로
- Select·Switch 터치 영역 44px 이상
- 캘리브레이션은 Drawer 우선 가능
- 순공 타이머가 여전히 가장 크게 보임
- 모바일 하단 내비게이션 유지
- camera video가 화면 폭을 넘지 않음
- landscape 전환 대응

---

# 25. 설정 페이지 연동

기존 설정 UI를 조사하고 중복 없이 연결한다.

실제 동작 항목:

- 카메라 미리보기 표시
- 관절 포인트 표시
- 카메라 좌우반전
- 선택 카메라 장치
- 기준 자세 다시 등록
- 캘리브레이션 초기화

설정 변경 시:

- overlay OFF → canvas 지움
- mirror 변경 → video·canvas 동시 반영
- camera 변경 → 기존 stream stop 후 새 stream
- calibration reset → 로컬 프로필 삭제 후 UI 갱신

---

# 26. Mock 모드 유지

Phase 1의 Mock 자세 제어를 삭제하지 않는다.

권장 노출 방식 중 기존 구조에 맞는 것을 선택한다.

- `?demo=true`
- “카메라 없이 데모 계속하기”
- 개발자용 Collapsible

Mock 모드는 다음 상황에서 반드시 동작한다.

- 카메라 권한 거부
- 카메라 없음
- MediaPipe 모델 실패
- 대회장 카메라 문제

Mock GOOD/BAD/AWAY가 기존 타이머를 계속 제어한다.

MediaPipe raw presence나 deviation은 Mock 상태를 덮어쓰지 않는다.

---

# 27. Phase 2와 기존 상태 머신의 경계

기존 `StudyStateMachine`과 `SessionTimer`를 변경해야 하는 경우 최소화한다.

Phase 2 데이터 흐름:

```text
CameraManager
→ MediaPipePoseEngine
→ PoseFeatureExtractor
→ CalibrationManager
→ PostureDeviationAnalyzer
→ UI 정보 표시
```

기존 타이머 흐름:

```text
MockPostureClassifier
→ 기존 StudyStateMachine
→ 기존 SessionTimer
```

이번 Phase에서 두 흐름을 합치지 않는다.

명시적 금지:

```text
poseDetected === false
→ setMockState("AWAY") 호출 금지

deviation.level === "HIGH"
→ setMockState("BAD") 호출 금지

MediaPipe result
→ SessionTimer.tick 직접 호출 금지
```

---

# 28. 성능·생명주기

필수 조건:

- MediaStream 하나
- PoseLandmarker 하나
- initialize Promise 하나
- rAF 루프 하나
- detect 중복 호출 없음
- camera off 시 loop 정지
- route unmount 시 loop 정지
- stream track stop
- PoseLandmarker close/dispose
- visibility hidden 시 일시정지 또는 주기 감소
- 이전 프레임 배열 무제한 축적 금지
- 원본 프레임 캡처 저장 금지

React StrictMode 개발 환경에서 effect setup·cleanup이 추가 실행되어도 다음이 남지 않아야 한다.

- 카메라 표시등 계속 켜짐
- stream 2개
- 추론 루프 2개
- engine 2개
- 이벤트 리스너 중복

---

# 29. 테스트

기존 Phase 1 테스트 35개가 모두 계속 통과해야 한다.

실제 카메라 하드웨어는 CI 테스트에서 요구하지 않는다.

## 29.1 CameraManager

1. start 시 getUserMedia 1회 호출
2. 중복 start 방지
3. stop 시 모든 track.stop 호출
4. video.srcObject 정리
5. switchDevice 시 이전 track 종료
6. 선택 장치 exact 실패 시 fallback
7. 권한 거부 오류 변환
8. 장치 없음 오류 변환
9. 장치 busy 오류 변환
10. stream ended 처리

## 29.2 camera-errors

각 DOMException name을 앱 오류 코드로 변환한다.

## 29.3 PoseFeatureExtractor

1. 정상 synthetic landmarks에서 특징 계산
2. 어깨 너비 정규화
3. 코 누락 시 null
4. 어깨 누락 시 null
5. 낮은 visibility 시 null
6. faceScale 불가 시 null
7. NaN 방지

## 29.4 통계 유틸리티

- median 홀수
- median 짝수
- 빈 배열
- MAD 계산

## 29.5 CalibrationManager

1. 상태 전이
2. 카운트다운 후 수집
3. 최소 샘플 부족 실패
4. 유효 샘플만 사용
5. 중앙값 프로필 생성
6. 품질 불량 실패 또는 warning
7. 취소
8. reset

## 29.6 PostureDeviationAnalyzer

1. 기준과 동일 → 낮은 score
2. head drop → HEAD_DROPPED
3. shoulder tilt → SHOULDER_TILTED
4. face scale 증가 → FACE_MOVED_CLOSER
5. horizontal shift → BODY_SHIFTED
6. null faceScale 안전 처리
7. score 0~1 clamp

## 29.7 좌표 매핑

- contain transform 가로 letterbox
- 세로 letterbox
- 동일 비율
- DPR 처리에 필요한 값

## 29.8 React lifecycle

- unmount 시 stream 정리
- loop cancel
- 오류 UI
- 카메라 없이 Mock 모드
- 기존 타이머 회귀 없음

---

# 30. README 갱신

README에 다음을 추가한다.

1. Phase 2 기능
2. 카메라 권한 요구사항
3. localhost 또는 HTTPS 필요
4. Chrome 기반 브라우저 우선 테스트 안내
5. MediaPipe Pose Landmarker Lite 역할
6. `.task` 모델 경로
7. WASM 복사 구조
8. 카메라 권한 문제 해결법
9. 카메라가 다른 앱에서 사용 중일 때 해결법
10. 캘리브레이션 사용법
11. Mock 모드 사용법
12. 개인정보 처리 방식
13. Phase 3에서 TM Pose를 연결할 예정임
14. 원본 영상이 저장되지 않음
15. 의료 진단이 아님

---

# 31. Vercel 검증

Phase 2 완료 후 Vercel Preview Deployment에서 실제 검증한다.

체크리스트:

```text
[ ] /app 직접 접속
[ ] 카메라 켜기 전 권한 요청 없음
[ ] 카메라 켜기 클릭 후 권한 팝업
[ ] 권한 허용 후 video 표시
[ ] MediaPipe 모델·WASM 404 없음
[ ] 관절점·연결선 표시
[ ] video와 skeleton 정렬
[ ] 좌우반전 ON/OFF 정렬
[ ] 관절 표시 ON/OFF
[ ] 사람 감지 Badge 변화
[ ] 기준 자세 캘리브레이션
[ ] 새로고침 후 프로필 복원
[ ] 카메라 끄기 후 하드웨어 표시등 종료
[ ] /app 이탈 후 하드웨어 표시등 종료
[ ] 모바일 360px overflow 없음
[ ] 카메라 권한 거부 UI
[ ] 카메라 없이 Mock 모드
[ ] 기존 순공 타이머 Mock 동작 정상
```

Preview URL을 완료 보고에 포함한다.

---

# 32. Phase 2 완료 기준

다음이 모두 충족돼야 완료다.

1. Phase 1이 main에 병합됨
2. 최신 main 기반 Phase 2 브랜치
3. `@mediapipe/tasks-vision` 설치 및 버전 고정
4. WASM 정적 자산 준비
5. Pose Landmarker Lite 공식 모델 준비
6. 사용자 버튼 클릭 전 권한 요청 없음
7. MediaStream 하나만 생성
8. 카메라 장치 선택 가능
9. 카메라 중지 시 track 종료
10. MediaPipe VIDEO 추론 동작
11. 한 명의 33개 관절 결과 처리
12. 관절 오버레이 표시
13. object-fit 좌표 정렬
14. 좌우반전 정렬
15. 사람 존재 원시 상태 표시
16. 3초 캘리브레이션 카운트다운
17. 2.5초 특징 수집
18. 최소 유효 샘플 검사
19. 중앙값 기준 프로필 생성
20. 프로필 localStorage 저장
21. 자세 편차 계산·표시
22. 실제 편차가 타이머를 제어하지 않음
23. Teachable Machine 런타임 미연결
24. 기존 Mock 모드 유지
25. 그룹 UI 변경 없음
26. 원본 영상·이미지 저장 없음
27. 기존 테스트 전부 통과
28. 신규 테스트 통과
29. lint 경고 0개
30. production build 성공
31. Vercel Preview 실제 카메라 동작
32. 페이지 이탈 후 자원 정리

---

# 33. 작업 종료 명령

반드시 실행한다.

```bash
npm run lint
npm run test
npm run build
```

가능하면 다음도 수행한다.

```bash
npm run dev
```

그리고 로컬 브라우저와 Vercel Preview에서 수동 검증한다.

---

# 34. 완료 보고 형식

다음 형식으로 보고한다.

```markdown
# Phase 2 완료 보고

## 구현 기능

## 아키텍처 및 데이터 흐름

## 타입·상태 정의

## 생성·변경 파일

## 설치 패키지와 고정 버전

## MediaPipe 모델·WASM 경로

## CameraManager 생명주기

## 추론 루프와 성능 제한

## 좌우반전·overlay 좌표 정책

## 캘리브레이션 구조

## 자세 특징과 편차 계산

## Mock 기능 유지 방식

## 테스트 결과
- npm run lint
- npm run test
- npm run build

## 로컬 수동 검증

## Vercel Preview URL 및 검증 결과

## 알려진 제한

## Phase 3 전에 사용자가 확인할 항목
```

Phase 3은 시작하지 말고 완료 보고 후 멈춘다.

---

# 35. 지금 바로 수행할 첫 요청

위 지시서를 읽고 바로 코드를 쓰지 말고 먼저 다음을 보고한다.

1. 현재 브랜치·PR·main 상태
2. Phase 1 기존 코드 구조 분석
3. Phase 2 구현 계획
4. 정확히 생성·수정할 파일
5. 설치할 패키지와 버전 결정 방식
6. MediaPipe 자산 배치 방식
7. 카메라·engine·hook 생명주기 설계
8. 타입과 상태 머신 설계
9. Phase 1 회귀 위험
10. Phase 2 완료 기준

계획 이후 Phase 2를 구현한다.
