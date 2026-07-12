# studylog Phase 3 — Teachable Machine Pose 모델 런타임 연동 지시서

## 0. 작업 시작 전 반드시 지킬 원칙

너는 `studylog` 프로젝트의 Phase 3를 구현하는 시니어 프론트엔드·브라우저 AI 개발자다.

현재 프로젝트는 Phase 1과 Phase 2가 완료된 상태라고 가정한다.

Phase 1에서 구현된 핵심 기능:

- React 19
- TypeScript strict
- Vite 8
- Tailwind CSS + shadcn/ui
- React Router 기반 랜딩·앱·기록·그룹·설정 라우트
- PC 사이드바·모바일 하단 내비게이션
- Mock GOOD/BAD/AWAY 자세 제어
- Mock Lux 슬라이더와 조도 상태
- delta 기반 순공·상세 시간 타이머
- 자리 비움 시간 기본 숨김 및 설정 연동
- 기록 Empty State
- 정적 그룹 페이지
- 그룹 액션 버튼 모두 disabled
- Vercel SPA rewrite
- lint·test·production build 통과

Phase 2에서 구현된 것으로 예상되는 핵심 기능:

- 사용자 동작 기반 카메라 권한 요청
- 단일 `MediaStream` 관리
- 카메라 장치 선택·변경
- 카메라 좌우반전
- MediaPipe Pose Landmarker Lite
- 웹캠 위 관절점·연결선 오버레이
- 사람 존재 여부 원시 표시
- 3초 카운트다운 기준 자세 등록
- 2.5초 자세 특징 수집
- 중앙값 기반 `CalibrationProfile`
- 현재 자세와 기준 자세의 상대 편차 계산
- 카메라·MediaPipe 오류 처리
- 페이지 이탈 시 카메라·추론 자원 정리
- 기존 Mock 타이머 제어 유지

Phase 2의 실제 코드 구조와 파일명은 위 설명과 다를 수 있다.
작업 시작 전에 반드시 현재 저장소를 조사하고, 이미 존재하는 책임과 클래스를 재사용한다.
기존 구조를 무시하고 동일한 기능을 중복 구현하지 않는다.

이번 작업에서는 **Phase 3만** 구현한다.

Phase 3의 목표는 현재 저장소에 포함된 파일럿 Teachable Machine Pose 모델을 실제 브라우저 런타임에 연결하여 다음을 수행하는 것이다.

```text
기존 CameraManager가 관리하는 하나의 video element
→ 정사각형 추론 입력 생성
→ Teachable Machine Pose 모델의 PoseNet 추론
→ 사용자가 학습한 자세 분류 모델 추론
→ 네 클래스의 원시 확률 표시
→ 최고 확률 클래스와 신뢰도 표시
→ 모델 상태·오류·성능 표시
```

이번 Phase에서는 다음을 하지 않는다.

- Teachable Machine 결과와 MediaPipe 편차 결과의 최종 융합
- 최근 결과 다수결 기반 최종 상태 안정화
- TM 결과를 실제 GOOD/BAD/AWAY 상태로 확정
- 실제 AI 결과로 순공 타이머 자동 제어
- 실제 AI 결과로 자리 비움 자동 처리
- 자세 경고 15초·쿨다운 120초 로직 연결
- 세션 로그 영속화 완성
- IndexedDB 리포트 완성
- 평가 CSV 내보내기 완성
- Python 데이터 분석
- PWA 완성
- 실제 그룹 기능

Phase 1의 Mock GOOD/BAD/AWAY 제어는 삭제하지 않는다.
Phase 2의 MediaPipe·카메라·캘리브레이션 기능도 회귀 없이 유지한다.

이번 Phase의 핵심 원칙:

1. Teachable Machine Pose 모델은 **기존 CameraManager의 동일한 video element**를 입력으로 사용한다.
2. `tmPose.Webcam`을 사용하지 않는다.
3. `navigator.mediaDevices.getUserMedia()`를 Teachable Machine 코드에서 다시 호출하지 않는다.
4. 카메라 MediaStream은 한 개만 존재해야 한다.
5. Teachable Machine Pose의 원시 결과는 화면과 디버그 정보에만 사용한다.
6. 원본 영상·이미지·추론 canvas를 저장하거나 서버로 전송하지 않는다.
7. 모델 파일은 프로젝트 내부 정적 자산만 사용한다.
8. 외부 CDN에 런타임 의존하지 않는다.
9. 패키지 호환성 문제를 전체 앱 구조에 퍼뜨리지 않고 어댑터 내부에 격리한다.
10. 모델 오류가 나도 랜딩·설정·Mock 데모 등 앱의 나머지 기능은 계속 동작해야 한다.
11. Phase 4를 임의로 시작하지 않는다.

---

# 1. 작업 시작 전 수행할 조사

코드를 작성하기 전에 아래 내용을 먼저 조사하고 보고한다.

1. 현재 브랜치와 최근 커밋
2. Phase 2 PR이 main에 병합되었는지
3. 현재 `CameraManager` 위치와 공개 API
4. 카메라 video element를 어디에서 소유하는지
5. MediaPipe 추론 루프의 위치와 실행 주기
6. MediaPipe 초기화·정리 생명주기
7. 좌우반전 설정이 어디에서 관리되는지
8. 캘리브레이션 저장 구조
9. 기존 `MockPostureClassifier` 또는 Mock 상태 제어 경로
10. `StudyStateMachine`과 `SessionTimer` 구조
11. `/evaluate` 페이지의 현재 구현 상태
12. `public/models/tm-pose/`의 세 파일 존재 여부
13. `metadata.json`에 정의된 labels와 modelSettings
14. 현재 package.json의 React·Vite·TypeScript·MediaPipe 버전
15. 현재 test 환경과 mocking 방식
16. Vercel Preview 배포 흐름

조사 후 다음을 먼저 출력한다.

- Phase 3 요구사항 해석
- 현재 구조에 맞춘 구현 계획
- 생성·수정할 파일 목록
- 런타임 호환 전략
- 설치하거나 고정할 패키지
- 모델 입력·좌우반전 정책
- 추론 스케줄링 정책
- Phase 2 회귀 위험
- Phase 3 완료 기준

계획을 먼저 보고한 후 코드를 작성한다.

---

# 2. 브랜치 및 작업 범위

Phase 2 변경사항을 main에 병합한 뒤 최신 main에서 아래 브랜치를 만든다.

```text
agent/studylog-phase-3-tm-pose
```

기존 Phase 2 브랜치에 직접 이어서 작업하지 않는다.

이번 Phase가 끝나면 Draft PR을 생성하되 main에 임의 병합하지 않는다.

---

# 3. 파일럿 모델 정보

현재 파일럿 모델은 Teachable Machine의 **Pose Project**에서 TensorFlow.js 형식으로 내보낸 모델이다.

Image Project 모델로 취급하지 않는다.

파일 위치:

```text
public/models/tm-pose/
├─ model.json
├─ metadata.json
└─ weights.bin
```

파일명은 `model.json` 내부 weights manifest와 일치해야 한다.
임의로 `.bin` 파일명을 변경하지 않는다.

필수 클래스 이름:

```text
GOOD_POSTURE
FORWARD_LEAN
SIDE_LEAN
RESTING
```

의미:

```text
GOOD_POSTURE
- 모니터 보기
- 자연스러운 필기
- 책 읽기
- 과도하게 무너지지 않은 정상 학습 자세

FORWARD_LEAN
- 얼굴과 목이 과도하게 앞으로 나온 상태
- 상체 전체가 책상·모니터 쪽으로 크게 전진한 상태

SIDE_LEAN
- 상체와 머리가 왼쪽 또는 오른쪽으로 크게 기울어진 상태

RESTING
- 팔에 머리를 기대는 상태
- 책상에 엎드리는 상태
- 학습 자세를 벗어나 크게 기대어 쉬는 상태
```

`AWAY` 클래스는 모델에 존재하지 않는다.
자리 비움은 Phase 4에서 MediaPipe 사람 미검출 지속시간으로 판단한다.

현재 모델은 웹 연동 확인용 파일럿 모델이다.
앱 UI에 `파일럿 모델` Badge를 표시할 수 있다.

---

# 4. Teachable Machine Pose의 실제 추론 구조

Teachable Machine Pose 모델은 하나의 단일 분류기만 실행하는 구조가 아니다.

실제 순서는 다음과 같다.

```text
이미지·video·canvas 입력
→ Teachable Machine Pose 내부 PoseNet
→ posenetOutput Float32Array 생성
→ 사용자가 학습한 자세 분류 모델
→ 클래스별 확률
```

공식 API 흐름:

```ts
const { pose, posenetOutput } = await model.estimatePose(input, flipHorizontal);
const predictions = await model.predict(posenetOutput);
```

이번 Phase에서는 MediaPipe 랜드마크를 Teachable Machine 분류기에 직접 넣으려고 시도하지 않는다.

이유:

- Teachable Machine Pose 분류기는 자신의 PoseNet에서 나온 `posenetOutput`을 입력으로 기대한다.
- MediaPipe의 33개 랜드마크 배열은 해당 입력 형식이 아니다.
- MediaPipe와 Teachable Machine Pose는 Phase 3에서 각각 별도로 추론한다.
- 두 결과를 의미적으로 합치는 작업은 Phase 4에서 한다.

---

# 5. 런타임 호환성 전략

Teachable Machine Pose 공식 패키지는 오래된 TensorFlow.js peer dependency를 선언하고 있으므로, 현재 React 19 + Vite 8 프로젝트에 무계획으로 최신 TensorFlow.js를 설치하지 않는다.

먼저 작은 호환성 검증을 수행한다.

## 전략 A — NPM 직접 import

우선 아래 정확한 패키지 조합을 검토한다.

```text
@teachablemachine/pose@0.8.6
@tensorflow/tfjs@1.3.1
```

직접 import 예시:

```ts
import * as tf from "@tensorflow/tfjs";
import * as tmPose from "@teachablemachine/pose";
```

다음이 모두 통과하면 전략 A를 사용한다.

- npm install 성공
- TypeScript strict 통과
- Vitest 통과
- Vite development 실행
- Vite production build 성공
- 실제 브라우저에서 모델 load 성공
- Vercel Preview에서 모델 load 성공

## 전략 B — 프로젝트 내부 local UMD runtime

전략 A가 Vite 번들·CJS·peer dependency 문제로 안정적으로 동작하지 않을 경우에만 전략 B를 사용한다.

전략 B에서는 공식 NPM 패키지의 배포 파일을 프로젝트 내부 정적 자산으로 복사한다.
외부 CDN을 사용하지 않는다.

예상 정적 파일:

```text
public/vendor/tm-pose/
├─ tf.min.js
└─ teachablemachine-pose.min.js
```

Node.js 동기화 스크립트 예시:

```text
scripts/sync-tm-pose-runtime.mjs
```

스크립트 책임:

1. 정확한 패키지 버전 설치 여부 확인
2. `@tensorflow/tfjs`의 공식 dist 번들 확인
3. `@teachablemachine/pose`의 공식 dist 번들 확인
4. `public/vendor/tm-pose` 생성
5. 파일 이름 유지 또는 명확한 고정 이름으로 복사
6. Windows와 Linux 모두 지원
7. 복사 실패 시 build를 조용히 계속하지 않고 오류 출력

로컬 스크립트 로더는 반드시 다음 순서로 로드한다.

```text
TensorFlow.js
→ Teachable Machine Pose
```

전략 B를 사용하면 `window.tf`, `window.tmPose` 타입 선언을 프로젝트 내부 `.d.ts` 파일에 추가한다.

## 선택 원칙

- 전략 A와 B를 동시에 production에서 사용하지 않는다.
- 동작하는 하나의 전략을 선택하고 README에 이유를 기록한다.
- peer dependency를 무시하기 위해 무조건 `--force`만 사용하는 해결법은 피한다.
- `@tensorflow/tfjs` 최신 버전을 임의로 설치하지 않는다.
- 원격 CDN fallback은 만들지 않는다.
- 런타임 전략은 `TmPoseRuntimeLoader` 내부에 격리한다.

---

# 6. 모델 캐시 및 버전

현재 파일럿 모델 경로는 아래를 유지한다.

```text
/models/tm-pose/model.json
/models/tm-pose/metadata.json
```

모델 설정을 한 파일로 분리한다.

```ts
export const TM_POSE_MODEL_CONFIG = {
  baseUrl: "/models/tm-pose/",
  modelUrl: "/models/tm-pose/model.json",
  metadataUrl: "/models/tm-pose/metadata.json",
  version: "pilot-v1",
  expectedLabels: [
    "GOOD_POSTURE",
    "FORWARD_LEAN",
    "SIDE_LEAN",
    "RESTING",
  ],
} as const;
```

모델 경로를 여러 파일에 문자열로 반복하지 않는다.

파일럿 개발 중 기존 모델 캐시 때문에 교체가 반영되지 않는 문제를 줄이기 위해 아래 중 현재 Vercel 구조에 가장 적합한 방법을 선택한다.

- model.json·metadata.json fetch에 version query 사용
- Vercel 모델 경로에 개발용 no-cache header 적용
- config의 version을 변경해 URL을 무효화

`model.json` 내부 weights 경로를 임의 수정하지 않는다.

최종 모델 교체가 쉬워야 한다.
최종 단계에서는 세 파일을 같은 위치에 동시에 교체하고 config의 version만 변경할 수 있도록 설계한다.

---

# 7. 권장 폴더 구조

현재 Phase 2 구조를 먼저 확인하고 아래 책임을 현재 프로젝트 naming에 맞게 배치한다.

```text
src/
├─ ai/
│  ├─ tm-pose/
│  │  ├─ TmPoseRuntimeLoader.ts
│  │  ├─ TmPoseModelAssetValidator.ts
│  │  ├─ TmPoseInputAdapter.ts
│  │  ├─ TeachableMachinePoseClassifier.ts
│  │  ├─ TmPoseInferenceScheduler.ts
│  │  ├─ tm-pose-config.ts
│  │  ├─ tm-pose-errors.ts
│  │  └─ tm-pose-types.ts
│  │
│  └─ PostureClassifier.ts
│
├─ hooks/
│  └─ useTeachableMachinePose.ts
│
├─ components/
│  └─ camera/
│     ├─ TmPosePredictionCard.tsx
│     ├─ TmPoseProbabilityBars.tsx
│     └─ TmPoseDebugPanel.tsx
│
└─ pages/
   └─ evaluation/
      └─ EvaluationPage.tsx
```

기존 프로젝트에 이미 `PostureClassifier` 인터페이스가 있다면 재사용한다.
이미 동일한 책임의 모델 로더·scheduler·hook이 있다면 중복 생성하지 않는다.

UI 컴포넌트에서 Teachable Machine API를 직접 호출하지 않는다.

---

# 8. 공통 PostureClassifier 인터페이스

Mock 구현체와 실제 TM Pose 구현체를 같은 인터페이스 아래에서 교체 가능하게 만든다.

예시:

```ts
export interface PostureClassifier {
  initialize(): Promise<void>;
  predict(input: PostureClassifierInput): Promise<PosturePredictionResult>;
  getStatus(): PostureClassifierStatus;
  getModelInfo(): PostureModelInfo | null;
  dispose(): Promise<void> | void;
}
```

입력 타입 예시:

```ts
export interface PostureClassifierInput {
  video: HTMLVideoElement;
  mirrorCamera: boolean;
  timestampMs: number;
}
```

Mock 구현체:

```text
MockPostureClassifier
```

실제 구현체:

```text
TeachableMachinePoseClassifier
```

Phase 3에서 기존 Mock 구현체를 삭제하지 않는다.

런타임 모드는 명확히 구분한다.

```ts
export type PostureClassifierMode = "MOCK" | "TM_POSE";
```

일반 사용자는 카메라와 모델이 준비되면 TM Pose 원시 예측을 볼 수 있고, 카메라 오류나 모델 오류 시 Mock 데모로 계속 진행할 수 있어야 한다.

---

# 9. Teachable Machine Pose 라벨 타입

정확한 타입을 정의한다.

```ts
export type TmPoseLabel =
  | "GOOD_POSTURE"
  | "FORWARD_LEAN"
  | "SIDE_LEAN"
  | "RESTING";
```

한글 표시 매핑을 한 파일에 둔다.

```ts
export const TM_POSE_LABEL_TEXT: Record<TmPoseLabel, string> = {
  GOOD_POSTURE: "정상 학습 자세",
  FORWARD_LEAN: "앞으로 기울임",
  SIDE_LEAN: "좌우 기울임",
  RESTING: "휴식·엎드림",
};
```

라벨 문자열을 UI 여러 곳에 직접 하드코딩하지 않는다.

---

# 10. 모델 상태 타입

모델 생명주기를 명확히 구분한다.

```ts
export type TmPoseEngineStatus =
  | "IDLE"
  | "LOADING_RUNTIME"
  | "LOADING_METADATA"
  | "LOADING_MODEL"
  | "VALIDATING_MODEL"
  | "READY"
  | "RUNNING"
  | "PAUSED"
  | "ERROR"
  | "DISPOSING"
  | "DISPOSED";
```

상태 의미:

```text
IDLE
- 아직 런타임이나 모델을 요청하지 않음

LOADING_RUNTIME
- TensorFlow.js와 TM Pose 런타임 준비 중

LOADING_METADATA
- metadata.json을 읽고 클래스·설정을 확인 중

LOADING_MODEL
- model.json과 weights.bin 로딩 중

VALIDATING_MODEL
- 모델 클래스와 출력 크기 검증 중

READY
- 입력이 들어오면 추론 가능

RUNNING
- 실시간 추론 루프 실행 중

PAUSED
- 카메라·탭 상태 때문에 일시 중지

ERROR
- 런타임·모델·추론 오류

DISPOSING
- 자원 해제 중

DISPOSED
- 자원 해제 완료
```

카메라 상태, MediaPipe 상태, TM Pose 상태, 공부 세션 상태를 서로 섞지 않는다.

---

# 11. 모델 오류 타입

오류 코드를 구분한다.

```ts
export type TmPoseErrorCode =
  | "RUNTIME_LOAD_FAILED"
  | "METADATA_NOT_FOUND"
  | "METADATA_INVALID"
  | "MODEL_NOT_FOUND"
  | "MODEL_LOAD_FAILED"
  | "WEIGHTS_LOAD_FAILED"
  | "LABEL_COUNT_MISMATCH"
  | "LABEL_NAME_MISMATCH"
  | "MODEL_OUTPUT_MISMATCH"
  | "INPUT_NOT_READY"
  | "POSE_ESTIMATION_FAILED"
  | "PREDICTION_FAILED"
  | "RUNTIME_DISPOSED"
  | "UNKNOWN";
```

사용자 화면에는 내부 stack trace를 노출하지 않는다.

예시 사용자 문구:

```text
모델 파일을 불러오지 못했습니다.
페이지를 새로고침하거나 Mock 데모 모드로 계속해 주세요.
```

```text
자세 모델의 클래스 구성이 예상과 다릅니다.
모델 파일을 다시 확인해 주세요.
```

개발자 Debug Sheet에는 오류 코드, 원본 메시지, asset URL을 표시할 수 있다.

---

# 12. metadata.json 검증

모델을 로드하기 전에 `metadata.json`을 직접 fetch하여 검증한다.

예상 metadata 타입:

```ts
export interface TmPoseMetadata {
  tfjsVersion?: string;
  tmVersion?: string;
  packageVersion?: string;
  packageName?: string;
  modelName?: string;
  timeStamp?: string;
  labels: string[];
  modelSettings?: {
    posenet?: {
      architecture?: string;
      outputStride?: number;
      inputResolution?: number;
      multiplier?: number;
    };
  };
}
```

필수 검증:

1. HTTP 응답 성공
2. JSON 파싱 성공
3. labels가 배열
4. labels 길이가 정확히 4
5. 예상 네 라벨이 모두 존재
6. 중복 라벨 없음
7. 빈 라벨 없음
8. 모델 출력 클래스 수와 metadata labels 수 일치

라벨 순서가 달라도 확률 결과를 className 기준으로 정규화한다.

단, 예상하지 못한 추가 클래스가 존재하면 오류로 처리한다.

검증 결과 타입 예시:

```ts
export interface TmPoseModelInfo {
  version: string;
  modelName: string | null;
  trainedAt: string | null;
  labels: TmPoseLabel[];
  inputResolution: number;
  runtimeStrategy: "NPM_ESM" | "LOCAL_UMD";
  isPilotModel: boolean;
}
```

---

# 13. 모델 로딩

모델 URL:

```text
/models/tm-pose/model.json
```

metadata URL:

```text
/models/tm-pose/metadata.json
```

공식 API의 URL load 방식을 사용한다.

```ts
const model = await tmPose.load(modelUrl, metadataUrl);
```

모델 로딩 Promise를 캐시해 중복 초기화를 막는다.

동시에 두 컴포넌트가 initialize를 요청해도 실제 load는 한 번만 실행되어야 한다.

모델 로딩은 랜딩 페이지 초기 진입에서 실행하지 않는다.

다음 시점 중 현재 앱 UX에 맞는 시점을 선택한다.

- 사용자가 카메라 켜기를 누른 직후
- 카메라가 READY가 된 직후
- 사용자가 `자세 AI 시작`을 누른 직후

랜딩 페이지 번들에 TM Pose와 TensorFlow.js 전체를 포함하지 않도록 dynamic import 또는 local runtime lazy loading을 사용한다.

---

# 14. TmPoseRuntimeLoader

런타임 준비 책임을 별도 클래스로 분리한다.

예시:

```ts
export class TmPoseRuntimeLoader {
  initialize(): Promise<TmPoseRuntime>;
  isReady(): boolean;
  getStrategy(): "NPM_ESM" | "LOCAL_UMD" | null;
  dispose(): void;
}
```

책임:

- TensorFlow.js runtime 로딩
- TM Pose runtime 로딩
- 중복 로딩 방지
- 선택한 backend 준비 대기
- 런타임 버전 정보 수집
- 오류 변환

가능하면 runtime 준비 후 다음을 확인한다.

```text
TensorFlow.js ready
사용 가능한 backend
TM Pose load 함수 존재
```

TensorFlow.js backend를 임의로 여러 번 전환하지 않는다.

WebGL backend가 정상적으로 준비되면 사용하고, 실패하면 CPU fallback을 검토한다.

fallback 정책은 실제 설치한 TF.js 버전에서 지원되는 API만 사용한다.

---

# 15. 단일 카메라 스트림 재사용

이번 Phase에서 가장 중요한 요구사항이다.

Teachable Machine 공식 `Webcam` helper를 사용하지 않는다.

금지:

```ts
new tmPose.Webcam(...)
```

금지:

```ts
navigator.mediaDevices.getUserMedia(...)
```

`TeachableMachinePoseClassifier` 내부에서 위 API를 직접 호출하지 않는다.

반드시 Phase 2에서 만든 CameraManager와 기존 `<video>` element를 재사용한다.

데이터 흐름:

```text
CameraManager
→ 하나의 MediaStream
→ 하나의 HTMLVideoElement
   ├─ MediaPipePoseEngine
   └─ TmPoseInputAdapter
      → TeachableMachinePoseClassifier
```

카메라를 끄면 두 AI 루프가 모두 즉시 중지돼야 한다.

카메라 장치를 변경해도 TM 모델을 매번 다시 로드할 필요는 없다.
입력 video만 새 stream을 사용하도록 한다.

---

# 16. Teachable Machine Pose 입력 비율

Teachable Machine Pose 학습 화면은 정사각형 웹캠 입력을 사용한다.
실제 앱 video가 16:9여도 모델 입력은 중앙 정사각형 crop으로 통일한다.

`TmPoseInputAdapter`를 구현한다.

```ts
export class TmPoseInputAdapter {
  configure(options: TmPoseInputOptions): void;
  capture(video: HTMLVideoElement): HTMLCanvasElement;
  getCanvas(): HTMLCanvasElement;
  dispose(): void;
}
```

옵션 예시:

```ts
export interface TmPoseInputOptions {
  inputSize: number;
  mirror: boolean;
  cropMode: "CENTER_SQUARE";
}
```

입력 크기:

1. metadata의 `modelSettings.posenet.inputResolution`이 유효하면 우선 사용
2. 없으면 257 사용
3. 너무 작거나 큰 값은 안전 범위로 제한

center-square crop 계산:

```text
videoWidth > videoHeight
→ 중앙 가로 영역을 잘라 정사각형 생성

videoHeight > videoWidth
→ 중앙 세로 영역을 잘라 정사각형 생성
```

추론 canvas는 화면에 기본 노출하지 않는다.
Debug Panel에서 옵션으로만 미리보기할 수 있다.

canvas는 매 프레임 새로 생성하지 않는다.
하나를 재사용한다.

---

# 17. 좌우반전 정책

Teachable Machine 웹캠 학습 환경은 일반적으로 거울처럼 좌우반전된 화면을 사용한다.
현재 studylog의 `mirrorCamera` 설정과 모델 입력을 일관되게 처리한다.

권장 정책:

1. `TmPoseInputAdapter`가 hidden inference canvas에 실제 mirror를 적용한다.
2. `model.estimatePose(inferenceCanvas, false)`를 호출한다.
3. 이미 mirror된 canvas에 `flipHorizontal=true`를 다시 적용하지 않는다.

즉:

```text
mirrorCamera = true
→ canvas draw 단계에서 좌우반전
→ estimatePose flipHorizontal = false
```

```text
mirrorCamera = false
→ canvas draw 단계에서 원본 방향
→ estimatePose flipHorizontal = false
```

좌우반전을 CSS에만 적용하고 추론 입력은 반전하지 않는 불일치를 만들지 않는다.

영상·MediaPipe 오버레이·TM 입력의 방향 정책을 README에 문서화한다.

`SIDE_LEAN`은 좌우를 하나의 클래스로 합쳤지만, 입력 방향 일관성은 여전히 유지해야 한다.

---

# 18. TeachableMachinePoseClassifier

예시 API:

```ts
export class TeachableMachinePoseClassifier implements PostureClassifier {
  initialize(): Promise<void>;
  predict(input: PostureClassifierInput): Promise<TmPosePredictionResult>;
  getStatus(): TmPoseEngineStatus;
  getModelInfo(): TmPoseModelInfo | null;
  getLastError(): TmPoseError | null;
  dispose(): Promise<void>;
}
```

initialize 흐름:

```text
IDLE
→ LOADING_RUNTIME
→ LOADING_METADATA
→ LOADING_MODEL
→ VALIDATING_MODEL
→ READY
```

predict 흐름:

```text
video 준비 확인
→ hidden square canvas 캡처
→ model.estimatePose(canvas, false)
→ pose와 posenetOutput 확인
→ model.predict(posenetOutput)
→ 클래스 확률 정규화
→ 최고 확률 클래스 선택
→ 결과 반환
```

`estimatePose`의 `pose`가 없거나 유효 점수가 낮으면 클래스를 억지로 확정하지 않는다.

결과를 `NOT_AVAILABLE` 상태로 반환한다.

---

# 19. 예측 결과 타입

```ts
export interface TmPoseClassProbability {
  label: TmPoseLabel;
  probability: number;
}
```

```ts
export interface TmPosePredictionResult {
  timestampMs: number;
  available: boolean;
  topLabel: TmPoseLabel | null;
  confidence: number;
  probabilities: Record<TmPoseLabel, number>;
  sortedProbabilities: TmPoseClassProbability[];
  poseScore: number | null;
  inferenceMs: number;
  modelVersion: string;
  runtimeStrategy: "NPM_ESM" | "LOCAL_UMD";
}
```

규칙:

- probability는 0~1로 clamp
- NaN은 허용하지 않음
- 누락 클래스는 0으로 조용히 채우기보다 모델 오류로 처리
- 확률을 class index만으로 매핑하지 않고 className 기준으로 매핑
- sortedProbabilities는 내림차순
- topLabel은 최고 확률 클래스
- Phase 3에서는 confidence가 낮아도 topLabel 자체는 디버그 정보로 표시 가능
- 사용자용 확정 상태에는 사용하지 않음

---

# 20. Pose 유효성 판단

TM Pose의 내부 PoseNet이 유효한 자세를 찾지 못했을 때 예측 클래스를 그대로 신뢰하지 않는다.

가능하면 `pose.score`와 주요 keypoint score를 확인한다.

초기 설정 예시:

```ts
export const TM_POSE_INFERENCE_CONFIG = {
  minPoseScore: 0.2,
  minKeypointScore: 0.35,
  intervalMs: 400,
} as const;
```

정확한 초기값은 파일럿 테스트에 따라 조정 가능하도록 config에 둔다.

유효성 조건 예시:

- pose 객체 존재
- pose.keypoints 배열 존재
- 코 또는 양쪽 어깨 중 충분한 keypoint score 존재
- 전체 pose score가 최소값 이상

유효하지 않으면:

```text
available = false
topLabel = null
confidence = 0
```

Phase 3에서 이 결과를 AWAY로 변환하지 않는다.

---

# 21. 추론 주기

MediaPipe와 TM Pose를 동시에 매 프레임 실행하면 UI가 버벅일 수 있다.

초기 목표:

```text
MediaPipe:
Phase 2 설정 유지, 약 6~8Hz

Teachable Machine Pose:
약 2.5Hz, interval 400ms

UI timer:
기존 1Hz
```

TM Pose 추론은 다음 조건에서만 실행한다.

1. 카메라 status READY
2. video.readyState 충분
3. videoWidth·videoHeight > 0
4. TM Pose engine READY
5. 이전 TM Pose 추론 완료
6. 페이지 visible
7. 새 video frame 존재

동시 `predict()`를 막는 in-flight guard를 사용한다.

예시:

```ts
if (this.inferenceInFlight) return;
this.inferenceInFlight = true;
try {
  // inference
} finally {
  this.inferenceInFlight = false;
}
```

`setInterval`을 무분별하게 중복 생성하지 않는다.
기존 Phase 2 루프 구조에 맞춰 requestAnimationFrame + throttle 또는 단일 scheduler를 사용한다.

---

# 22. MediaPipe와의 부하 조정

Phase 2 MediaPipe 추론과 Phase 3 TM Pose 추론이 동시에 메인 스레드에 몰리지 않도록 한다.

현재 구조를 조사한 뒤 아래 중 하나를 선택한다.

## 선택 A — 가벼운 공용 추론 mutex

```ts
class BrowserAiInferenceCoordinator {
  tryAcquire(engine: "MEDIAPIPE" | "TM_POSE"): boolean;
  release(engine: "MEDIAPIPE" | "TM_POSE"): void;
}
```

한 순간에 무거운 추론 하나만 실행한다.

## 선택 B — 시간 오프셋 스케줄링

MediaPipe와 TM Pose의 실행 타이밍을 약간 어긋나게 설정한다.

예:

```text
MediaPipe: 0ms, 150ms, 300ms...
TM Pose: 75ms, 475ms, 875ms...
```

## 선택 원칙

- 현재 Phase 2 구조를 과도하게 뜯어고치지 않는다.
- 실제 브라우저에서 프레임 드롭이 크지 않다면 최소 수정 방식을 사용한다.
- 동시 추론 때문에 카메라·타이머가 멈추면 안 된다.
- Web Worker는 이번 Phase에서 구현하지 않는다.

성능 문제가 심하면 완료 보고에 측정값과 Phase 4 제안을 남긴다.

---

# 23. 적응형 추론 속도

초기 400ms 주기를 사용한다.

최근 TM Pose 추론 시간이 주기보다 지속적으로 길면 추론 빈도를 낮춘다.

예시:

```text
평균 추론 0~250ms
→ 400ms 유지

평균 추론 250~450ms
→ 600ms로 완화

평균 추론 450ms 이상
→ 1000ms로 완화하고 성능 주의 표시
```

이 기능은 복잡한 자동 튜닝이 아니라 간단한 안전 장치로 구현한다.

Debug Panel에 다음을 표시한다.

- 최근 inference ms
- 이동 평균 inference ms
- 현재 추론 interval
- 추정 Hz

---

# 24. 탭·페이지 생명주기

다음 상황에서 TM Pose 추론을 일시중지한다.

- `document.visibilityState === "hidden"`
- 카메라 OFF
- video pause
- 앱이 `/app`에서 다른 페이지로 이동
- 모델 dispose 중
- 사용자 세션이 manual pause이며 카메라도 숨기도록 설정됨

탭이 다시 visible이 되고 카메라와 모델이 준비된 경우 안전하게 재개한다.

페이지 이탈 시:

- scheduler 취소
- in-flight 결과의 UI 반영 방지
- hidden canvas 참조 정리
- 모델 dispose 정책 실행

모델을 페이지 이동마다 항상 다시 다운로드할지, 앱 세션 동안 singleton으로 유지할지는 현재 앱 라우팅 구조를 보고 결정한다.

원칙:

- 카메라 stream은 Phase 2 정책에 따라 정리
- TM 모델 중복 인스턴스 금지
- dispose 이후 stale callback이 store를 갱신하지 않음

---

# 25. 모델 dispose 및 메모리

Teachable Machine Pose 모델은 내부적으로 분류 모델과 PoseNet 모델을 보유한다.

현재 실제 런타임 객체의 API를 확인하고 가능한 자원을 방어적으로 정리한다.

예시 원칙:

```ts
try {
  internalClassifierModel?.dispose?.();
} catch {}

try {
  loadedTmPoseModel?.dispose?.();
} catch {}
```

동일 객체를 위험하게 이중 dispose하지 않도록 실제 구현을 확인한다.

TensorFlow.js runtime에 `tf.memory()`가 제공되는 경우 Debug Panel에서 개발용으로만 다음을 표시할 수 있다.

- numTensors
- numBytes

일반 사용자 화면에는 표시하지 않는다.

카메라를 켰다 껐다 반복했을 때 tensor 수가 계속 증가하지 않는지 수동 점검 절차를 README에 적는다.

---

# 26. UI 표시 원칙

Phase 3에서 TM Pose 결과는 사용자에게 **원시 AI 예측**임을 분명히 표시한다.

메인 상태 카드의 `학습 중 / 자세 확인 / 자리 비움`을 실제 TM 결과로 바꾸지 않는다.

기존 Mock 타이머 상태와 TM 원시 예측을 혼동하지 않도록 영역을 분리한다.

예시 카드:

```text
AI 자세 모델 · 파일럿

현재 원시 예측
정상 학습 자세
신뢰도 86%

정상 학습 자세     86%
앞으로 기울임       8%
좌우 기울임         4%
휴식·엎드림         2%
```

설명:

```text
현재 결과는 상태 안정화 전의 원시 예측입니다.
순공 타이머에는 아직 반영되지 않습니다.
```

shadcn/ui 사용 후보:

- Card
- Badge
- Progress
- Skeleton
- Alert
- Tooltip
- Collapsible
- Sheet

모델이 로딩 중이면 Skeleton과 상태 문구를 표시한다.

모델 오류 시:

- 오류 Alert
- 다시 시도 버튼
- Mock 데모로 계속하기 버튼

---

# 27. class probability 표시

네 클래스 확률을 항상 같은 순서로 보여준다.

```text
GOOD_POSTURE
FORWARD_LEAN
SIDE_LEAN
RESTING
```

각 항목:

- 한글 라벨
- 영어 코드 Tooltip
- 0~100% 값
- Progress bar

확률은 소수점 한 자리 또는 정수 퍼센트로 표시한다.

색상은 현재 studylog 디자인 시스템을 따른다.

- GOOD_POSTURE: 에메랄드
- FORWARD_LEAN: 앰버
- SIDE_LEAN: 앰버
- RESTING: 중성 또는 레드 계열

색상만으로 의미를 전달하지 않는다.

---

# 28. Main UI와 Debug UI 분리

일반 사용자용 카드에는 다음만 표시한다.

- 모델 상태
- 최고 확률 자세
- 신뢰도
- 파일럿 모델 Badge
- 원시 예측 안내

고급 Debug Sheet에는 다음을 표시한다.

- runtime strategy
- TensorFlow.js 버전
- TM Pose package 버전
- model version
- metadata modelName
- metadata timestamp
- 클래스 목록
- input resolution
- mirror 설정
- pose score
- inference ms
- 평균 inference ms
- 추론 Hz
- hidden input canvas 미리보기 옵션
- raw probabilities
- 마지막 오류 코드
- 모델 재로드 버튼

Debug Sheet는 기본적으로 접혀 있어야 한다.

---

# 29. `/evaluate` 페이지 Phase 3 범위

Phase 3에서는 `/evaluate`를 모델 진단용 화면으로 개선할 수 있다.

이번 Phase에서 허용되는 기능:

- 카메라 켜기
- TM Pose 모델 로딩 상태
- 실시간 클래스 확률
- 최고 확률 클래스
- 모델 파일 정보
- 파일럿 모델 안내
- 사용자가 실제 라벨을 선택하는 UI 틀
- 3초 테스트 버튼 UI 틀

이번 Phase에서 필수로 영속화하지 않는 기능:

- IndexedDB 평가 기록
- CSV 다운로드
- 혼동행렬
- 전체 정확도
- 참여자별 분석

단, 구현 비용이 낮고 기존 구조가 준비되어 있다면 3초 동안 예측을 메모리에서 모아 **화면에만** 결과를 보여주는 임시 진단 기능은 허용한다.

이 경우에도 저장·CSV는 Phase 5로 남긴다.

임시 3초 진단 결과 예시:

```text
실제 자세: SIDE_LEAN
예측 자세: SIDE_LEAN
평균 신뢰도: 88.4%
테스트 결과: 일치
```

이 결과는 새로고침하면 사라져도 된다.

---

# 30. 모델 재시도와 fallback

모델 로딩 실패 시 전체 앱을 크래시시키지 않는다.

가능한 사용자 선택:

```text
[모델 다시 불러오기]
[카메라 없이 데모 계속하기]
```

재시도 시:

- 이전 오류 상태 정리
- 이전 partially loaded model 정리
- 중복 runtime script 방지
- initialize Promise 재생성
- 최대 무한 반복 방지

자동 재시도는 한 번 이하로 제한한다.

사용자가 명시적으로 재시도할 수 있다.

---

# 31. Mock 모드 유지

기존 Mock GOOD/BAD/AWAY 상태 제어는 삭제하지 않는다.

권장 노출 방식:

- `?demo=true`
- 개발자 데모 패널
- 카메라 오류 fallback

TM Pose 원시 예측과 Mock 타이머 상태는 별개임을 명확히 한다.

예:

```text
Mock 타이머 상태: GOOD
TM 원시 예측: FORWARD_LEAN
```

Phase 3에서는 위 불일치를 오류로 보지 않는다.
Phase 4에서 통합할 예정이다.

---

# 32. 현재 타이머와 연결 금지

다음 코드를 만들지 않는다.

```ts
if (tmTopLabel === "GOOD_POSTURE") {
  timer.startEffectiveTime();
}
```

```ts
if (tmTopLabel !== "GOOD_POSTURE") {
  studyState = "BAD";
}
```

```ts
if (!tmPoseAvailable) {
  studyState = "AWAY";
}
```

Phase 3에서 `StudyStateMachine`과 `SessionTimer`는 기존 Mock 입력으로 계속 동작한다.

TM 결과는 별도 store 또는 별도 slice에서 관리한다.

---

# 33. 상태 store

기존 Zustand 구조를 확인한다.

TM Pose 상태는 세션 상태와 분리한다.

예시:

```ts
interface TmPoseStoreState {
  status: TmPoseEngineStatus;
  modelInfo: TmPoseModelInfo | null;
  prediction: TmPosePredictionResult | null;
  error: TmPoseError | null;
  enabled: boolean;
  lastUpdatedAt: number | null;
}
```

store에 저장하지 않을 것:

- video element
- canvas element
- raw pose keypoints 전체
- posenetOutput Float32Array
- TensorFlow tensor
- model 인스턴스

위 객체는 service·hook의 ref 또는 클래스 내부에서 관리한다.

---

# 34. React hook

기존 hook 구조에 맞춰 `useTeachableMachinePose` 또는 동등한 hook을 구현한다.

책임:

- classifier initialize 요청
- camera READY 확인
- 추론 loop 시작·정지
- prediction을 store 또는 local state에 반영
- visibility 처리
- unmount cleanup
- 오류 전달

hook이 직접 다음 책임까지 모두 수행하지 않도록 한다.

- 모델 asset 검증
- canvas crop 계산
- 모델 API 래핑
- timer 제어

각 책임은 클래스·유틸리티로 분리한다.

---

# 35. 모델 입력 canvas 테스트 모드

Debug Sheet에서 `TM 입력 미리보기`를 켤 수 있게 한다.

보이는 화면은 실제 video 전체가 아니라 모델에 전달되는 정사각형 crop이어야 한다.

이 기능은 다음을 확인하기 위한 것이다.

- 머리와 양쪽 어깨가 crop 안에 들어오는지
- 좌우반전이 학습 환경과 같은지
- 정사각형 중앙 crop이 올바른지
- 모델이 화면의 너무 작은 영역만 보는지

기본값은 OFF다.

원본 frame을 저장하거나 다운로드하는 기능은 만들지 않는다.

---

# 36. 성능 측정

Phase 3 완료 시 실제 노트북 환경에서 최소 다음을 측정한다.

- TM 모델 최초 로딩 시간
- 첫 예측까지 걸린 시간
- 평균 TM 추론 시간
- MediaPipe와 TM 동시 실행 시 UI 체감
- 카메라 프레임 끊김 여부
- 1분 실행 후 메모리 증가 여부

수치는 완료 보고에 포함한다.

성능이 나쁘더라도 Phase 4 기능을 임의로 줄이지 않는다.
먼저 원인을 보고하고 개선 후보를 제시한다.

---

# 37. 테스트 전략

실제 카메라와 TensorFlow 모델을 CI 단위 테스트에 직접 요구하지 않는다.

가짜 runtime·가짜 model·가짜 video를 주입할 수 있도록 설계한다.

필수 테스트:

## TmPoseModelAssetValidator

1. 정확한 네 라벨 통과
2. 라벨 하나 누락 시 실패
3. 추가 라벨 존재 시 실패
4. 중복 라벨 실패
5. labels 배열이 아닐 때 실패
6. class order가 달라도 className 기준 정규화
7. inputResolution fallback

## TmPoseInputAdapter

1. 16:9 video 중앙 정사각형 crop 계산
2. 세로 video 중앙 정사각형 crop 계산
3. 정사각형 video 유지
4. mirror ON transform
5. mirror OFF transform
6. canvas 인스턴스 재사용
7. video 크기 0일 때 오류

## TeachableMachinePoseClassifier

1. initialize 중복 호출 시 모델 load 한 번
2. metadata → model 순서
3. estimatePose → predict 순서
4. 네 클래스 확률 정규화
5. 최고 확률 클래스 선택
6. 낮은 pose score 시 available=false
7. predict 오류 변환
8. dispose 호출
9. disposed 상태에서 predict 차단
10. 모델 클래스 불일치 시 ERROR

## TmPoseInferenceScheduler

1. interval 전에는 predict 호출하지 않음
2. in-flight 중복 추론 방지
3. hidden tab에서 일시정지
4. 카메라 OFF에서 일시정지
5. 재개 후 중복 loop 없음
6. unmount cleanup
7. 느린 추론 시 interval 완화

## 회귀 테스트

1. 기존 MediaPipe 관절 오버레이 유지
2. 기존 캘리브레이션 유지
3. 기존 Mock GOOD/BAD/AWAY 유지
4. 기존 순공 타이머 동작 유지
5. 기존 Lux 동작 유지
6. 그룹 버튼 disabled 유지
7. TM 결과가 timer를 변경하지 않음
8. Teachable Machine 코드에서 getUserMedia 호출 없음

기존 모든 Phase 1·2 테스트가 계속 통과해야 한다.

---

# 38. 네트워크 및 정적 자산 테스트

Vercel Preview에서 다음 요청이 성공하는지 확인한다.

```text
/models/tm-pose/model.json
/models/tm-pose/metadata.json
/models/tm-pose/weights.bin
```

확인 항목:

- HTTP 200
- 올바른 content type 또는 다운로드 가능
- model.json이 weights.bin을 정상 참조
- 대소문자 일치
- SPA rewrite가 asset 요청을 index.html로 잘못 돌리지 않음

외부 CDN 요청이 없어야 한다.

브라우저 Network 탭에서 확인한다.

---

# 39. Vercel 검증

Phase 3 완료 후 Vercel Preview에서 실제 검증한다.

체크리스트:

```text
[ ] /app 직접 접속 성공
[ ] 카메라 권한 요청 성공
[ ] MediaPipe 관절 오버레이 유지
[ ] TM runtime 로딩 성공
[ ] metadata.json 로딩 성공
[ ] model.json·weights.bin 로딩 성공
[ ] 네 클래스 확률 표시
[ ] 최고 확률 클래스 실시간 변경
[ ] 카메라 한 번만 요청
[ ] 좌우반전 변경 후 모델 입력 일관성
[ ] 카메라 OFF 시 TM 추론 중지
[ ] 다른 페이지 이동 시 TM 추론 정리
[ ] 모델 오류 시 Mock 데모 가능
[ ] 외부 CDN 요청 없음
[ ] 직접 새로고침 404 없음
```

Vercel Preview URL을 완료 보고에 포함한다.

---

# 40. UI 직접 검증 시나리오

## 시나리오 A — 정상 모델 로딩

```text
/app 접속
→ 카메라 켜기
→ MediaPipe 준비
→ TM Pose 모델 준비
→ 파일럿 Badge 표시
→ 네 확률 표시
```

## 시나리오 B — 자세 변경

```text
정상 자세
→ GOOD_POSTURE 확률 상승

상체 앞으로 이동
→ FORWARD_LEAN 확률 상승

한쪽으로 기울임
→ SIDE_LEAN 확률 상승

책상에 엎드림
→ RESTING 확률 상승
```

정확도가 낮더라도 모델 연결 자체가 정상인지 확인한다.
파일럿 모델의 성능 문제는 코드 오류와 구분한다.

## 시나리오 C — 모델 파일 오류

개발 환경에서 임시 잘못된 URL을 사용해 다음 UI를 확인한다.

```text
모델 오류 Alert
다시 시도
Mock 데모 계속
앱 전체는 크래시하지 않음
```

검증 후 URL을 정상 복구한다.

## 시나리오 D — 자원 정리

```text
카메라 ON
→ TM 추론 시작
→ 카메라 OFF
→ TM 추론 중지
→ 카메라 표시등 OFF
→ 재시작
→ 모델·loop 중복 없음
```

---

# 41. README 갱신

README에 다음을 추가한다.

1. Phase 3 기능
2. Teachable Machine Pose Project 모델임을 명시
3. 네 클래스 설명
4. 모델 파일 경로
5. 선택한 런타임 전략
6. TensorFlow.js·TM Pose 고정 버전
7. 단일 카메라 stream 공유 구조
8. `tmPose.Webcam`을 사용하지 않는 이유
9. 정사각형 center crop
10. 좌우반전 정책
11. 추론 주기
12. 파일럿 모델 한계
13. 모델 세 파일 교체 방법
14. Mock fallback 사용법
15. Phase 4에서 융합·안정화·자동 타이머 제어 예정

모델 교체 문서:

```text
1. Teachable Machine Pose에서 최종 모델 학습
2. TensorFlow.js 형식으로 다운로드
3. model.json, metadata.json, weights.bin을 동시에 교체
4. 클래스 이름 유지
5. TM_POSE_MODEL_CONFIG.version 변경
6. npm run build
7. Vercel 재배포
8. Network·클래스 검증
```

---

# 42. 구현하지 않을 것 재확인

이번 Phase에서 아래는 절대 구현하지 않는다.

- TM + MediaPipe 최종 융합 점수
- 최근 12개 중 8개 다수결
- GOOD 1.5초, BAD 3초, AWAY 2.5초 최종 전환
- BAD 15초 경고
- 120초 자세 경고 쿨다운
- 실제 AI 결과로 SessionTimer 제어
- 실제 AI 결과로 StudyStateMachine 변경
- 실제 AWAY 자동 일시정지
- 최종 세션 로그 저장
- 평가 CSV
- Python 분석
- PWA
- 실제 그룹 기능

위 항목은 Phase 4 이후다.

---

# 43. Phase 3 완료 기준

아래 조건을 모두 충족해야 Phase 3 완료다.

1. 최신 main에서 Phase 3 브랜치 생성
2. 기존 Phase 2 카메라 정상
3. 기존 MediaPipe 정상
4. 기존 캘리브레이션 정상
5. 파일럿 TM Pose 모델 로딩
6. metadata class 검증
7. 정확한 네 라벨 확인
8. 단일 video element 공유
9. 추가 getUserMedia 호출 없음
10. `tmPose.Webcam` 미사용
11. 정사각형 center crop 입력
12. mirror 정책 일관성
13. `estimatePose` 실행
14. `predict` 실행
15. 네 클래스 확률 표시
16. 최고 확률 클래스 표시
17. inference ms 표시
18. 파일럿 모델 Badge
19. 모델 오류 UI
20. 다시 시도 동작
21. Mock fallback 유지
22. 타이머 자동 연결 없음
23. StudyStateMachine 자동 변경 없음
24. TM 추론 2~3Hz 수준 제한
25. in-flight 중복 방지
26. hidden tab 일시정지
27. 카메라 OFF 시 추론 중지
28. 페이지 이탈 시 cleanup
29. 외부 CDN 요청 없음
30. 기존 테스트 전부 통과
31. 신규 테스트 통과
32. lint 경고 0개
33. production build 성공
34. Vercel Preview 실제 모델 로딩 성공
35. README 갱신
36. Phase 4 임의 시작 안 함

---

# 44. 완료 후 실행할 명령

기존 package.json script를 확인한 뒤 최소 다음을 실행한다.

```bash
npm run lint
npm run test
npm run build
```

가능하면 TypeScript 별도 검사 script가 있으면 함께 실행한다.

```bash
npm run typecheck
```

패키지 취약점 자동 수정 명령으로 의존성을 임의 업그레이드하지 않는다.

---

# 45. 완료 보고 형식

Phase 3 구현 후 아래 형식으로 보고한다.

## 구현 기능

## 생성·변경 파일

## 설치 패키지와 정확한 버전

## 선택한 런타임 전략

```text
NPM_ESM 또는 LOCAL_UMD
선택 이유
```

## 모델 파일 검증 결과

```text
labels
modelName
timeStamp
inputResolution
modelVersion
```

## 단일 카메라 공유 구조

## 정사각형 crop·좌우반전 정책

## 추론 스케줄링

```text
MediaPipe Hz
TM Pose Hz
평균 inference ms
```

## 테스트 결과

```text
npm run lint
npm run test
npm run build
```

## Vercel Preview 검증 결과

## Vercel Preview URL

## 파일럿 모델에서 확인한 오분류

## 알려진 제한

## Phase 4 전에 확인할 사항

Phase 4를 임의로 시작하지 말고 완료 보고 후 멈춘다.

---

# 46. 지금 수행할 첫 작업

먼저 Phase 2 PR을 main에 병합했는지 확인하고, 최신 main에서 Phase 3 브랜치를 만든다.

그 다음 아래 순서로만 진행한다.

```text
1. 현재 카메라·MediaPipe 구조 조사
2. metadata.json 실제 내용 검증
3. NPM 직접 import 호환성 spike
4. lint·build·브라우저 검증
5. 실패 시 local UMD 전략 검증
6. 하나의 런타임 전략 확정
7. TmPoseModelAssetValidator 구현
8. TmPoseInputAdapter 구현
9. TeachableMachinePoseClassifier 구현
10. 카메라와 연결
11. 추론 scheduler 구현
12. raw prediction UI 구현
13. 테스트
14. Vercel Preview 검증
15. 완료 보고
```

모델 성능 개선이나 최종 데이터 재학습은 이번 Phase의 책임이 아니다.
현재 파일럿 모델의 정확도가 낮더라도 모델 로딩·추론·UI·자원 정리가 정상이라면 Phase 3 목적은 달성한 것이다.
