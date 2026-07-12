# studylog Phase 4 — AI 결과 융합·상태 안정화·실제 타이머 제어 구현 지시서

## 0. 작업 시작 원칙

당신은 `studylog` 프로젝트의 Phase 4를 구현하는 시니어 TypeScript·React·브라우저 AI 개발자다.

이번 작업을 시작하기 전에 반드시 다음 문서를 끝까지 읽는다.

- `AGENTS.md`
- `docs/PROJECT_BRIEF.md`
- `docs/PHASE_2_BRIEF.md`
- `docs/PHASE_3_BRIEF.md`

그리고 현재 저장소의 실제 구현을 먼저 확인한다.

특히 다음 파일과 책임을 찾아서 분석한다.

- Phase 1의 Mock 자세 입력 구조
- `StudyStateMachine` 또는 동등한 상태 관리 코드
- `SessionTimer` 또는 동등한 타이머 코드
- Phase 2의 `CameraManager`
- Phase 2의 `MediaPipePoseEngine`
- Phase 2의 `CalibrationManager`
- Phase 2의 `PostureDeviationAnalyzer`
- Phase 3의 `TeachableMachinePoseClassifier`
- Phase 3의 실시간 원시 예측 store 또는 hook
- Lux 상태 및 `MockLuxProvider`
- Today 화면의 상태 표시 구조

기존 구현과 역할이 겹치는 클래스를 새로 중복 생성하지 않는다.
기존 구조가 적절하면 확장하고, 구조적 문제가 있을 때만 작게 리팩터링한다.

## Git 작업

Phase 3 결과가 main에 반영되어 있는지 확인한다.

- Phase 3가 아직 main에 없다면 먼저 그 사실을 보고한다.
- main에 Phase 3가 반영된 뒤 최신 main에서 새 브랜치를 만든다.

권장 브랜치명:

```text
agent/studylog-phase-4-runtime-integration
```

이 문서는 프로젝트에 아래 경로로 저장한다.

```text
docs/PHASE_4_BRIEF.md
```

코드를 바로 작성하지 말고, 먼저 아래 내용을 보고한다.

1. 현재 브랜치와 main 상태
2. Phase 1~3의 기존 구조 분석
3. 재사용할 클래스와 리팩터링할 클래스
4. Phase 4 구현 계획
5. 생성·변경 예정 파일
6. 상태 타입과 상태 전이 설계
7. 실제 AI 입력과 Mock 입력을 분리하는 방법
8. MediaPipe와 TM Pose 결과의 freshness 처리
9. 타이머 누적 규칙
10. 경고 및 쿨다운 설계
11. 회귀 위험
12. Phase 4 완료 기준

계획 보고 후 Phase 4만 구현한다.
Phase 5 이상의 작업은 임의로 시작하지 않는다.

---

# 1. Phase 4 목표

이번 Phase의 핵심 목표는 Phase 2와 Phase 3에서 각각 얻은 결과를 실제 서비스 상태로 연결하는 것이다.

```text
웹캠
 ├─ MediaPipe
 │   ├─ 사람 존재 여부
 │   ├─ 기준 자세 편차
 │   └─ 편차 원인
 │
 └─ Teachable Machine Pose
     ├─ GOOD_POSTURE
     ├─ FORWARD_LEAN
     ├─ SIDE_LEAN
     └─ RESTING
           ↓
PostureFusionEngine
           ↓
원시 자세 결과
           ↓
PostureStateMachine
- 최근 결과 다수결
- 지속시간 검증
- UNKNOWN 보호
- 자리 비움 검증
           ↓
안정화 자세 상태
           +
LuxStateMachine의 안정화 조도 상태
           ↓
StudyStatusResolver
           ↓
사용자 화면 상태 + 실제 SessionTimer 제어
```

반드시 구현할 항목:

1. MediaPipe와 TM Pose 결과를 하나의 원시 자세 판단으로 융합
2. 오래된 AI 결과를 사용하지 않는 freshness 검증
3. 최근 12개 결과 중 8개 이상 다수결
4. GOOD 1.5초 지속 조건
5. BAD 3초 지속 조건
6. AWAY 2.5초 지속 조건
7. UNKNOWN 최대 2초 보호
8. 조도 상태 안정화와 자세 상태 결합
9. 실제 AI 모드에서 순공 타이머 자동 제어
10. Mock 모드 유지
11. AI 모드와 Mock 모드의 명확한 분리
12. 자세 경고 15초 및 120초 쿨다운
13. 조도 경고 안정화 및 쿨다운
14. 상태 변화 UI
15. 단위 테스트와 통합 테스트
16. Vercel Preview에서 실제 동작 확인

---

# 2. 이번 Phase에서 하지 않을 것

다음 기능은 구현하지 않는다.

- IndexedDB에 장기 세션 로그 저장
- 완성된 기록 페이지
- 완성된 세션 리포트 차트
- CSV 내보내기 완성
- 평가 페이지 완성
- Python 데이터 분석 프로그램
- 최종 모델 v2 교체
- PWA 완성
- 실제 그룹 생성·초대·입장
- 로그인·DB·API·WebSocket
- 의료적 자세 진단
- 실제 집중력 판정

Phase 5에서 기록·CSV·리포트를 구현하고,
Phase 6에서 Python 분석을 구현한다.

---

# 3. 반드시 유지할 불변 조건

1. 브라우저 카메라 MediaStream은 하나만 생성한다.
2. MediaPipe와 TM Pose는 같은 `HTMLVideoElement`를 공유한다.
3. 원본 영상과 이미지 프레임을 저장하거나 서버로 전송하지 않는다.
4. 원본 MediaPipe 랜드마크 배열을 영속 저장하지 않는다.
5. 그룹 기능은 더미 UI 상태를 유지한다.
6. Mock GOOD/BAD/AWAY 기능은 비상 데모를 위해 삭제하지 않는다.
7. Mock 모드와 AI 모드가 동시에 타이머를 제어하면 안 된다.
8. 낮은 신뢰도 또는 오래된 결과를 억지로 GOOD/BAD로 분류하지 않는다.
9. 단일 프레임으로 사용자 상태를 변경하지 않는다.
10. 카메라·모델 오류가 앱 전체 오류로 확산되지 않게 한다.
11. 세션을 사용자가 수동 일시정지한 경우 모든 시간 누적을 멈춘다.
12. 자리 비움 누적 시간은 기본 화면에서 숨긴다.

---

# 4. 제어 모드

실제 AI와 Mock 데모를 분리하는 명확한 타입을 만든다.

```ts
export type RuntimeControlMode = "AI" | "MOCK";
```

## AI 모드

다음 입력만 사용자 상태와 타이머를 제어한다.

- MediaPipe poseDetected
- MediaPipe 기준 자세 편차
- Teachable Machine Pose 예측
- MockLuxProvider의 조도값

## MOCK 모드

Phase 1의 GOOD/BAD/AWAY 버튼과 Lux 슬라이더가 상태와 타이머를 제어한다.

## 전환 원칙

- 앱 기본은 기존 UX에 맞게 결정하되, 실제 카메라·두 AI 엔진·캘리브레이션이 모두 준비되면 AI 모드를 선택할 수 있어야 한다.
- 일반 사용자 화면에서는 AI 모드가 우선이다.
- Mock 모드는 `?demo=true`, 개발자 패널, 또는 카메라 없는 데모 fallback에서만 보인다.
- 모드를 바꿀 때 이전 모드의 후보 상태, ring buffer, 경고 지속시간을 초기화한다.
- 모드 전환이 기존 세션 타이머를 중복 실행시키면 안 된다.
- 모드 전환 순간의 큰 delta가 누적되지 않게 한다.

권장 인터페이스:

```ts
interface RuntimeModeController {
  getMode(): RuntimeControlMode;
  setMode(mode: RuntimeControlMode): void;
  resetTransientState(): void;
}
```

Zustand를 사용 중이라면 UI 상태는 store에 둘 수 있지만,
상태 전이 알고리즘은 테스트 가능한 순수 클래스 또는 함수로 분리한다.

---

# 5. 핵심 타입

기존 타입이 있으면 중복 생성하지 말고 아래 의미가 충족되도록 확장한다.

## 5.1 Teachable Machine 원시 예측

```ts
export type TmPostureLabel =
  | "GOOD_POSTURE"
  | "FORWARD_LEAN"
  | "SIDE_LEAN"
  | "RESTING";

export interface TmClassProbability {
  label: TmPostureLabel;
  probability: number;
}

export interface TmPosePrediction {
  timestampMs: number;
  label: TmPostureLabel;
  confidence: number;
  probabilities: Record<TmPostureLabel, number>;
  inferenceMs: number;
  modelVersion: string;
}
```

## 5.2 MediaPipe 신호

```ts
export type DeviationReason =
  | "FACE_MOVED_CLOSER"
  | "HEAD_DROPPED"
  | "SHOULDER_TILTED"
  | "BODY_SHIFTED";

export interface MediaPipePostureSignal {
  timestampMs: number;
  poseDetected: boolean;
  deviationScore: number | null;
  deviationReasons: DeviationReason[];
  inferenceMs: number;
  calibrationAvailable: boolean;
}
```

## 5.3 원시 융합 결과

```ts
export type RawPostureState =
  | "GOOD"
  | "BAD"
  | "NO_POSE"
  | "UNKNOWN";

export type BadPostureReason =
  | "FORWARD_LEAN"
  | "SIDE_LEAN"
  | "RESTING"
  | "BASELINE_DEVIATION";

export interface FusedPostureObservation {
  timestampMs: number;
  rawState: RawPostureState;
  badReason: BadPostureReason | null;

  tmLabel: TmPostureLabel | null;
  tmConfidence: number | null;
  tmFresh: boolean;

  poseDetected: boolean;
  mediaPipeFresh: boolean;
  deviationScore: number | null;
  deviationReasons: DeviationReason[];

  reasonCode:
    | "NO_POSE"
    | "TM_NOT_READY"
    | "TM_STALE"
    | "MEDIAPIPE_STALE"
    | "TM_LOW_CONFIDENCE"
    | "TM_BAD_CLASS"
    | "TM_GOOD_MEDIAPIPE_NORMAL"
    | "TM_GOOD_MEDIAPIPE_DEVIATED"
    | "CALIBRATION_REQUIRED"
    | "UNKNOWN";
}
```

## 5.4 안정화 자세 상태

```ts
export type StablePostureState =
  | "GOOD"
  | "BAD"
  | "AWAY"
  | "UNKNOWN";

export interface StablePostureSnapshot {
  timestampMs: number;
  state: StablePostureState;
  badReason: BadPostureReason | null;
  confidence: number | null;
  changedAtMs: number;
  stateDurationMs: number;
  isTransitioning: boolean;
  candidateState: StablePostureState | null;
  candidateDurationMs: number;
}
```

## 5.5 조도 상태

기존 타입이 있으면 그대로 재사용한다.

```ts
export type LuxStatus =
  | "DARK"
  | "DIM"
  | "RECOMMENDED"
  | "BRIGHT"
  | "TOO_BRIGHT";

export interface StableLuxSnapshot {
  timestampMs: number;
  lux: number;
  status: LuxStatus;
  changedAtMs: number;
  stateDurationMs: number;
  isTransitioning: boolean;
}
```

## 5.6 사용자 표시 상태

```ts
export type StudyStatus =
  | "STUDYING"
  | "POSTURE_CAUTION"
  | "LUX_CAUTION"
  | "MULTI_CAUTION"
  | "AWAY"
  | "CHECKING"
  | "PAUSED";
```

## 5.7 세션 생명주기

기존 타입을 재사용하되 의미를 분리한다.

```ts
export type SessionLifecycle =
  | "IDLE"
  | "INITIALIZING"
  | "CALIBRATING"
  | "RUNNING"
  | "PAUSED"
  | "FINISHED"
  | "ERROR";
```

카메라 상태, AI 엔진 상태, 자세 상태, 세션 상태를 하나의 enum에 섞지 않는다.

---

# 6. 결과 freshness

MediaPipe와 TM Pose는 서로 다른 주기로 추론한다.
오래된 마지막 결과가 계속 사용되지 않도록 freshness를 검증한다.

설정 객체 예시:

```ts
export interface RuntimeFreshnessConfig {
  tmMaxAgeMs: number;
  mediaPipeMaxAgeMs: number;
}

export const DEFAULT_FRESHNESS_CONFIG: RuntimeFreshnessConfig = {
  tmMaxAgeMs: 1_000,
  mediaPipeMaxAgeMs: 600,
};
```

현재 시각은 `performance.now()` 기반 단조 증가 시각을 사용한다.

```ts
const tmFresh =
  prediction !== null &&
  nowMs - prediction.timestampMs <= config.tmMaxAgeMs;
```

카메라가 꺼졌거나 페이지를 이동했거나 추론이 중단된 경우,
마지막 GOOD 예측이 계속 순공 시간으로 사용되면 안 된다.

freshness 실패 시:

- MediaPipe stale → `UNKNOWN`
- TM stale → `UNKNOWN`
- 카메라가 명확히 꺼짐 → AI 모드에서는 `UNKNOWN` 또는 PAUSED 안내
- poseDetected=false가 신선한 MediaPipe 결과에서 확인됨 → `NO_POSE`

---

# 7. PostureFusionEngine

다음 책임을 가진 클래스를 구현한다.

```ts
export class PostureFusionEngine {
  constructor(config: PostureFusionConfig);

  fuse(input: {
    nowMs: number;
    tmPrediction: TmPosePrediction | null;
    mediaPipeSignal: MediaPipePostureSignal | null;
  }): FusedPostureObservation;
}
```

설정 타입:

```ts
export interface PostureFusionConfig {
  tmMinimumConfidence: number;
  mediaPipeBadDeviationThreshold: number;
  freshness: RuntimeFreshnessConfig;
  requireCalibrationForGood: boolean;
}
```

초기값:

```ts
export const DEFAULT_POSTURE_FUSION_CONFIG: PostureFusionConfig = {
  tmMinimumConfidence: 0.55,
  mediaPipeBadDeviationThreshold: 0.65,
  freshness: {
    tmMaxAgeMs: 1_000,
    mediaPipeMaxAgeMs: 600,
  },
  requireCalibrationForGood: true,
};
```

모든 숫자는 한 설정 파일에 둔다.
여러 컴포넌트에 하드코딩하지 않는다.

## 7.1 판정 우선순위

### 1순위: MediaPipe 결과가 없음 또는 stale

```text
MediaPipe 결과 없음/stale
→ UNKNOWN
```

### 2순위: 신선한 MediaPipe 결과에서 포즈 미검출

```text
poseDetected = false
→ NO_POSE
```

Teachable Machine이 이전 GOOD을 유지하고 있어도 NO_POSE가 우선한다.

### 3순위: 캘리브레이션 필요

`requireCalibrationForGood=true`이고 캘리브레이션이 없으면:

```text
TM이 GOOD이어도
→ UNKNOWN
→ CALIBRATION_REQUIRED
```

단, TM이 FORWARD/SIDE/RESTING을 높은 신뢰도로 예측하면 BAD로 표현할 수 있다.

### 4순위: TM 결과 없음 또는 stale

```text
TM 결과 없음/stale
→ UNKNOWN
```

### 5순위: 낮은 TM 신뢰도

```text
confidence < 0.55
→ UNKNOWN
```

### 6순위: TM이 나쁜 자세 클래스

```text
FORWARD_LEAN
→ BAD / FORWARD_LEAN

SIDE_LEAN
→ BAD / SIDE_LEAN

RESTING
→ BAD / RESTING
```

MediaPipe 편차가 낮아도 TM BAD 결과를 GOOD으로 올리지 않는다.

### 7순위: TM이 GOOD_POSTURE

```text
TM GOOD_POSTURE
+ 캘리브레이션 존재
+ deviationScore < 0.65
→ GOOD
```

```text
TM GOOD_POSTURE
+ deviationScore >= 0.65
→ BAD / BASELINE_DEVIATION
```

편차 점수가 null이면 안전하게 UNKNOWN으로 처리한다.

## 7.2 원시 결과는 즉시 타이머에 연결하지 않는다

`FusedPostureObservation.rawState`는 디버그·상태 머신 입력일 뿐이다.
`SessionTimer`가 직접 사용하면 안 된다.

---

# 8. PostureStateMachine

Phase 1에 상태 머신이 있다면 중복 생성하지 말고 책임을 명확히 리팩터링한다.

이번 상태 머신은 `FusedPostureObservation`을 받아 안정화된 자세 상태를 반환한다.

```ts
export class PostureStateMachine {
  constructor(config: PostureStabilityConfig);

  update(
    observation: FusedPostureObservation,
    nowMs: number,
  ): StablePostureSnapshot;

  getSnapshot(nowMs: number): StablePostureSnapshot;
  reset(nowMs: number): void;
}
```

설정:

```ts
export interface PostureStabilityConfig {
  windowSize: number;
  consensusCount: number;
  goodHoldMs: number;
  badHoldMs: number;
  awayHoldMs: number;
  unknownGraceMs: number;
}

export const DEFAULT_POSTURE_STABILITY_CONFIG = {
  windowSize: 12,
  consensusCount: 8,
  goodHoldMs: 1_500,
  badHoldMs: 3_000,
  awayHoldMs: 2_500,
  unknownGraceMs: 2_000,
};
```

## 8.1 ring buffer

- 최대 12개의 원시 상태를 보관한다.
- 새 관측이 들어올 때만 추가한다.
- 같은 timestamp를 중복 추가하지 않는다.
- 오래된 세션의 결과가 새 세션에 남지 않게 reset한다.
- `RawPostureState`와 `badReason`을 함께 보관한다.

## 8.2 GOOD/BAD 다수결

최근 12개 중 8개 이상 동일한 GOOD 또는 BAD일 때 후보로 인정한다.

```text
GOOD 8개 이상
→ GOOD 후보

BAD 8개 이상
→ BAD 후보
```

BAD 후보의 대표 이유는 최근 BAD 결과 중 가장 많이 나타난 이유를 사용한다.
동률이면 최근 결과를 우선한다.

## 8.3 후보 지속시간

후보가 바뀌면 `candidateSinceMs`를 갱신한다.

```text
GOOD 후보가 1.5초 유지
→ 안정 GOOD

BAD 후보가 3초 유지
→ 안정 BAD
```

후보가 중간에 깨지면 지속시간을 초기화한다.

## 8.4 AWAY 처리

AWAY는 TM 다수결이 아니라 MediaPipe의 신선한 NO_POSE 지속시간으로 판정한다.

```text
NO_POSE 연속 2.5초
→ 안정 AWAY
```

NO_POSE가 2.5초 미만이면 기존 안정 상태를 유지하고 `isTransitioning=true`로 표시한다.

## 8.5 UNKNOWN 처리

```text
UNKNOWN 0~2초
→ 기존 안정 상태 유지
→ isTransitioning=true
```

UNKNOWN이 2초를 초과하면:

```text
stable state = UNKNOWN
```

사용자 화면은 `CHECKING`을 표시한다.
UNKNOWN 동안 순공 시간은 증가하지 않는다.

## 8.6 AWAY에서 복귀

사람이 다시 나타났다고 즉시 GOOD으로 바꾸지 않는다.
GOOD 또는 BAD에 대한 다수결과 지속시간을 다시 충족해야 한다.

## 8.7 타임스탬프 역행 보호

`nowMs`가 이전 update보다 작으면:

- 개발 환경에서 명확한 경고 또는 예외
- production에서는 안전하게 무시 또는 clamp

시간 계산은 `performance.now()` 기반으로 통일한다.

---

# 9. LuxStateMachine

Phase 1에 조도 상태 로직이 있으면 재사용한다.
없거나 즉시 상태를 바꾸고 있다면 안정화 클래스로 분리한다.

```ts
export class LuxStateMachine {
  update(lux: number, nowMs: number): StableLuxSnapshot;
  reset(nowMs: number): void;
}
```

기본 분류:

```text
0~299       DARK
300~499     DIM
500~700     RECOMMENDED
701~1000    BRIGHT
1001 이상   TOO_BRIGHT
```

프로젝트 기본값이며 설정 가능해야 한다.

## 안정화

```text
새 조도 상태 3초 지속
→ 확정 상태 변경
```

임계값 주변에서 반복 전환을 줄이기 위해 hysteresis를 적용한다.

권장 초기 hysteresis:

```text
20 Lux
```

예:

```text
DIM → RECOMMENDED
최소 기준 + 20 이상에서 3초

RECOMMENDED → DIM
최소 기준 - 20 미만에서 3초
```

설정값 변경 시 상태 머신을 안전하게 재평가한다.

---

# 10. StudyStatusResolver

안정 자세와 안정 조도를 사용자 표시 상태로 변환하는 순수 함수를 구현한다.

```ts
export function resolveStudyStatus(input: {
  lifecycle: SessionLifecycle;
  posture: StablePostureState;
  luxStatus: LuxStatus;
}): StudyStatus;
```

규칙:

```text
lifecycle = PAUSED
→ PAUSED

posture = UNKNOWN
→ CHECKING

posture = AWAY
→ AWAY

posture = GOOD + lux = RECOMMENDED
→ STUDYING

posture = BAD + lux = RECOMMENDED
→ POSTURE_CAUTION

posture = GOOD + lux != RECOMMENDED
→ LUX_CAUTION

posture = BAD + lux != RECOMMENDED
→ MULTI_CAUTION
```

조도 `BRIGHT`와 `DIM`도 프로젝트 권장 범위 밖이므로 주의로 취급한다.

---

# 11. 실제 SessionTimer 연결

기존 `SessionTimer`를 재사용하고, 로직이 컴포넌트에 흩어져 있다면 클래스로 모은다.

내부 시간:

```ts
export interface SessionDurations {
  totalSessionMs: number;
  effectiveStudyMs: number;
  seatedMs: number;
  postureCautionMs: number;
  awayMs: number;
  luxCautionMs: number;
  checkingMs: number;
}
```

`checkingMs`를 추가하기 어렵다면 내부 메트릭으로만 유지할 수 있지만,
UNKNOWN 시간이 다른 지표에 잘못 포함되지 않게 해야 한다.

## tick 입력

```ts
export interface SessionTimerTickInput {
  lifecycle: SessionLifecycle;
  stablePosture: StablePostureState;
  luxStatus: LuxStatus;
  countLuxInEffectiveTime: boolean;
  deltaMs: number;
}
```

## 누적 규칙

### lifecycle이 RUNNING이 아닐 때

```text
모든 시간 증가 없음
```

### totalSessionMs

```text
RUNNING이면 항상 증가
```

AWAY와 CHECKING도 전체 세션에는 포함한다.

### seatedMs

```text
posture = GOOD 또는 BAD
→ 증가
```

### effectiveStudyMs

`countLuxInEffectiveTime=true`:

```text
posture = GOOD
+ lux = RECOMMENDED
→ 증가
```

`countLuxInEffectiveTime=false`:

```text
posture = GOOD
→ 증가
```

### postureCautionMs

```text
posture = BAD
→ 증가
```

### awayMs

```text
posture = AWAY
→ 증가
```

### luxCautionMs

```text
posture = GOOD 또는 BAD
+ lux != RECOMMENDED
→ 증가
```

`postureCautionMs`와 `luxCautionMs`는 동시에 증가할 수 있다.
두 시간의 합이 total과 같다고 가정하지 않는다.

### checkingMs

```text
posture = UNKNOWN
→ 증가
```

## delta 처리

- monotonic timestamp를 사용한다.
- 음수 delta를 허용하지 않는다.
- 탭 복귀 등으로 delta가 비정상적으로 큰 경우 처리 정책을 명시한다.
- 권장 최대 단일 tick delta: 2,000ms.
- 큰 delta는 clamp하고 개발 로그에 남긴다.
- 동일 tick이 중복 실행되지 않게 한다.

## UI 표시

기본 화면:

- `effectiveStudyMs`만 크게 표시
- 현재 조도
- 현재 상태

설정으로 표시:

- totalSessionMs
- postureCautionMs
- awayMs
- luxCautionMs

자리 비움 시간은 기본 OFF를 유지한다.

---

# 12. 런타임 오케스트레이션

React 컴포넌트가 각 엔진을 직접 조합하며 복잡한 if문을 갖지 않게 한다.

기존 구조에 맞춰 다음 중 하나를 구현한다.

```text
StudyRuntimeController 클래스
또는
useStudyRuntime hook + 테스트 가능한 순수 엔진들
```

권장 책임:

```ts
interface StudyRuntimeSnapshot {
  mode: RuntimeControlMode;
  fusedObservation: FusedPostureObservation | null;
  stablePosture: StablePostureSnapshot;
  stableLux: StableLuxSnapshot;
  studyStatus: StudyStatus;
  durations: SessionDurations;
  runtimeReady: boolean;
  blockingReason: RuntimeBlockingReason | null;
}
```

```ts
export type RuntimeBlockingReason =
  | "CAMERA_NOT_READY"
  | "MEDIAPIPE_NOT_READY"
  | "TM_NOT_READY"
  | "CALIBRATION_REQUIRED"
  | "MODEL_ERROR"
  | "CAMERA_ERROR";
```

오케스트레이터 책임:

1. 최신 TM 예측 구독
2. 최신 MediaPipe 신호 구독
3. Lux값 구독
4. 융합 엔진 실행
5. 자세 상태 머신 업데이트
6. 조도 상태 머신 업데이트
7. 표시 상태 해결
8. 타이머 tick
9. 경고 관리자 업데이트
10. 모드 전환 reset
11. 세션 시작·정지 reset
12. 페이지 unmount 정리

다음 루프를 여러 컴포넌트에서 중복 생성하지 않는다.

- 타이머 interval
- 상태 융합 interval
- 경고 duration interval

가능하면 하나의 runtime tick에서 `performance.now()`와 delta를 계산한다.

---

# 13. AI 모드 준비 조건

AI 모드에서 실제 타이머 제어를 시작하려면 다음 조건을 확인한다.

```text
카메라 READY
MediaPipe READY/RUNNING
TM Pose READY/RUNNING
캘리브레이션 존재
세션 RUNNING
```

하나라도 부족하면:

- 순공 시간 증가 없음
- `CHECKING` 또는 적절한 준비 안내 표시
- 준비 부족 이유를 UI에 표시
- Mock 모드로 자동 몰래 전환하지 않음
- 사용자가 명시적으로 데모 모드를 선택할 수 있게 함

예:

```text
기준 자세를 먼저 등록해 주세요.
```

```text
자세 분석 모델을 준비하고 있습니다.
```

---

# 14. AlertManager

다음 책임을 가진 별도 클래스를 구현한다.

```ts
export class AlertManager {
  update(input: AlertUpdateInput): AlertEvent[];
  reset(nowMs: number): void;
}
```

## 14.1 자세 경고

```text
안정 BAD 상태 15초 이상
→ 경고 1회
```

동일 자세 경고 쿨다운:

```text
120초
```

BAD reason이 달라지더라도 과도한 연속 알림을 막는다.
권장 정책:

- 전역 자세 경고 쿨다운 120초
- reason별 마지막 경고 시각도 기록 가능

경고 문구:

```text
FORWARD_LEAN
상체가 기준 자세보다 앞으로 이동한 상태가 지속되고 있습니다.
자세를 잠시 확인해 주세요.
```

```text
SIDE_LEAN
몸이 한쪽으로 기울어진 상태가 지속되고 있습니다.
편안한 자세로 다시 앉아 주세요.
```

```text
RESTING
휴식 자세가 일정 시간 지속되고 있습니다.
필요하다면 잠시 쉬었다가 다시 시작해 주세요.
```

```text
BASELINE_DEVIATION
현재 자세가 등록한 기준 자세에서 크게 벗어났습니다.
자세를 다시 확인해 주세요.
```

## 14.2 조도 경고

안정화 Lux 상태가 다음일 때 경고한다.

```text
DARK
TOO_BRIGHT
```

DIM과 BRIGHT는 화면 주의만 표시하고 소리 알림은 선택적이다.

조도 경고 쿨다운:

```text
60초
```

## 14.3 출력

- shadcn Alert 또는 상태 카드
- Sonner toast
- 설정이 켜져 있을 때 짧은 경고음

브라우저 자동재생 정책을 고려한다.
세션 시작 버튼 같은 사용자 gesture 이후 오디오 사용 준비를 한다.
오디오 재생 실패가 전체 앱 오류가 되면 안 된다.

## 14.4 다음 상황에서는 경고하지 않는다

- 세션 PAUSED
- AWAY
- UNKNOWN/CHECKING
- AI 준비 전
- Mock 모드에서 해당 Mock 경고가 비활성화된 경우

---

# 15. UI 요구사항

기존 shadcn/ui 디자인을 유지한다.

## 기본 메인 상태 카드

### STUDYING

```text
🟢 학습 중
기준 자세와 설정한 밝기 조건을 유지하고 있습니다.
```

### POSTURE_CAUTION

```text
🟡 자세를 확인해 주세요
상세 원인 한 줄
```

### LUX_CAUTION

```text
🟠 주변 밝기를 확인해 주세요
현재 조도 및 범위 설명
```

### MULTI_CAUTION

```text
🟠 학습 환경을 확인해 주세요
자세와 밝기 모두 확인이 필요합니다.
```

### AWAY

```text
⏸ 자리를 비워 순공 타이머가 일시정지되었습니다.
```

자리 비움 누적 시간은 기본 표시하지 않는다.

### CHECKING

```text
AI가 현재 자세를 확인하고 있습니다.
```

### PAUSED

```text
세션이 일시정지되었습니다.
```

## 상태 전환 UX

- 매 raw prediction마다 UI 색상을 바꾸지 않는다.
- 오직 안정 상태가 바뀔 때 메인 상태를 변경한다.
- 후보 상태는 기본 UI에 크게 노출하지 않는다.
- 디버그 패널에서만 후보·다수결·지속시간을 보여준다.

## 디버그 패널

Collapsible 또는 Sheet 내부에 다음을 표시한다.

- Runtime mode
- TM label/confidence
- MediaPipe poseDetected
- deviation score/reasons
- raw fused state
- 최근 12개 상태
- consensus count
- candidate state
- candidate duration
- stable posture
- stable Lux
- current StudyStatus
- effective timer 조건 충족 여부

프로덕션에서도 심사 시연을 위해 열 수 있지만 기본은 닫혀 있어야 한다.

---

# 16. Mock 모드 보존

Mock 모드는 AI 결과와 완전히 분리한다.

Mock 입력:

```text
GOOD
BAD
AWAY
```

Mock 모드에서도 LuxStateMachine과 SessionTimer 규칙은 동일하게 사용한다.

Mock GOOD은 `StablePostureState.GOOD`처럼 동작한다.
Mock BAD은 `StablePostureState.BAD`처럼 동작한다.
Mock AWAY는 `StablePostureState.AWAY`처럼 동작한다.

Mock 버튼을 누를 때 실제 AI ring buffer를 오염시키지 않는다.
AI 모드로 돌아올 때 state machine을 reset하고 다시 안정화한다.

모델 오류 시 자동으로 몰래 Mock으로 바꾸지 않는다.

오류 UI에서 사용자가 명시적으로 다음 버튼을 선택할 수 있게 한다.

```text
데모 모드로 계속하기
```

---

# 17. 세션 시작·종료와 reset

## 새 세션 시작

다음을 초기화한다.

- PostureStateMachine ring buffer
- 후보 상태
- UNKNOWN grace
- AlertManager 지속시간과 쿨다운 상태
- SessionTimer durations
- 마지막 tick timestamp

캘리브레이션 프로필은 유지할 수 있다.

## 수동 일시정지

- AI 추론 자체는 UI 표시를 위해 계속할 수 있다.
- 모든 세션 시간 누적 중단
- 경고 지속시간 중단 또는 reset 정책을 명확히 한다.
- 권장: PAUSED 시 경고 지속시간 reset.

## 재개

- 큰 delta가 누적되지 않도록 마지막 tick 시각 재설정
- 자세 안정 상태는 유지 가능하나, 권장 조건 확인을 위해 짧은 CHECKING을 거쳐도 된다.
- 구현 정책을 테스트로 고정한다.

## 종료

- 타이머 중단
- 경고 중단
- 현재 메모리 세션 요약 생성 가능
- Phase 5 영속 저장은 아직 구현하지 않는다.
- 카메라 종료 여부는 기존 UX를 따른다.

---

# 18. 낮은 조도와 순공 시간

설정:

```ts
countLuxInEffectiveTime: boolean
```

기본값:

```text
true
```

true:

```text
GOOD + RECOMMENDED
→ effectiveStudyMs 증가
```

false:

```text
GOOD
→ effectiveStudyMs 증가
```

false여도 조도 경고와 luxCautionMs 기록은 유지한다.

UI 설명:

```text
조도 조건을 순공 시간 계산에 포함합니다.
끄더라도 밝기 경고와 조도 기록은 유지됩니다.
```

---

# 19. 성능

기존 Phase 2·3 주기를 유지하거나 실제 측정에 따라 조정한다.

권장 초기값:

```text
MediaPipe 6~8Hz
TM Pose 3~4Hz
Runtime fusion 6~8Hz 또는 새 MediaPipe 결과 시
SessionTimer tick 4Hz 이하
UI 타이머 표시 1Hz 또는 부드러운 requestAnimationFrame 포맷
```

주의:

- fusion 루프를 렌더링마다 만들지 않는다.
- 같은 TM prediction을 여러 번 사용하더라도 freshness를 확인한다.
- React state를 8Hz로 불필요하게 전체 앱에 전파하지 않는다.
- 디버그 데이터와 메인 UI 데이터를 분리한다.
- timer tick과 UI 렌더 tick을 분리할 수 있다.
- 페이지 unmount 시 모든 runtime loop를 정리한다.
- AI 모드가 아니면 불필요한 fusion tick을 줄인다.

---

# 20. 오류 처리

## TM 오류

- `UNKNOWN`
- 순공 시간 증가 중단
- 오류 카드 표시
- Mock 데모 선택 가능
- MediaPipe 자체 UI는 계속 표시 가능

## MediaPipe 오류

- `UNKNOWN`
- 순공 시간 증가 중단
- TM raw prediction은 디버그에 표시 가능
- Mock 데모 선택 가능

## 캘리브레이션 없음

- AI 모드의 GOOD 확정 금지
- `기준 자세 등록` CTA
- TM BAD는 정보용으로 표시 가능

## 카메라 종료

- stale 결과 사용 금지
- AI 상태 `CHECKING` 또는 준비 필요
- 순공 시간 증가 중단

## Lux 값 오류

- NaN, Infinity, 음수 거부
- 사용자 설정 최대값 범위로 clamp 또는 명확한 validation
- 0은 허용

---

# 21. 단위 테스트

Vitest를 사용한다.
실제 카메라나 실제 모델을 테스트에 요구하지 않는다.

## 21.1 PostureFusionEngine

최소 테스트:

1. MediaPipe 결과 없음 → UNKNOWN
2. MediaPipe stale → UNKNOWN
3. 신선한 poseDetected=false → NO_POSE
4. TM 결과 없음 → UNKNOWN
5. TM stale → UNKNOWN
6. TM confidence 0.54 → UNKNOWN
7. FORWARD_LEAN 0.9 → BAD/FORWARD_LEAN
8. SIDE_LEAN 0.9 → BAD/SIDE_LEAN
9. RESTING 0.9 → BAD/RESTING
10. GOOD 0.9 + 낮은 deviation → GOOD
11. GOOD 0.9 + 높은 deviation → BAD/BASELINE_DEVIATION
12. GOOD + calibration 없음 → UNKNOWN
13. stale GOOD이 카메라 종료 후 유지되지 않음

## 21.2 PostureStateMachine

최소 테스트:

1. GOOD 1개로 안정 상태 변경 안 됨
2. 12개 중 GOOD 7개는 후보 아님
3. 12개 중 GOOD 8개는 후보
4. GOOD 후보 1.49초는 전환 안 됨
5. GOOD 후보 1.5초 후 GOOD
6. BAD 후보 2.99초는 전환 안 됨
7. BAD 후보 3초 후 BAD
8. BAD reason 대표값 선택
9. NO_POSE 2.49초는 AWAY 아님
10. NO_POSE 2.5초 후 AWAY
11. UNKNOWN 1.9초는 이전 상태 유지
12. UNKNOWN 2초 초과 후 UNKNOWN
13. AWAY에서 포즈 복귀 후 즉시 GOOD 아님
14. reset 후 이전 buffer 제거
15. 중복 timestamp 무시
16. timestamp 역행 보호

## 21.3 LuxStateMachine

1. 각 구간 분류
2. 새 상태 3초 미만 유지 시 기존 상태
3. 3초 후 변경
4. hysteresis 경계
5. 설정 임계값 변경
6. NaN 처리

## 21.4 StudyStatusResolver

모든 조합을 테스트한다.

- GOOD + RECOMMENDED → STUDYING
- BAD + RECOMMENDED → POSTURE_CAUTION
- GOOD + DARK → LUX_CAUTION
- BAD + DARK → MULTI_CAUTION
- AWAY → AWAY
- UNKNOWN → CHECKING
- lifecycle PAUSED → PAUSED

## 21.5 SessionTimer

1. RUNNING + GOOD + RECOMMENDED → total/effective/seated 증가
2. BAD → total/seated/postureCaution 증가
3. AWAY → total/away 증가
4. UNKNOWN → total/checking 증가
5. GOOD + DARK + lux 반영 ON → effective 증가 안 함
6. GOOD + DARK + lux 반영 OFF → effective 증가
7. BAD + DARK → postureCaution/luxCaution 동시 증가
8. PAUSED → 모든 증가 없음
9. 음수 delta 거부
10. 큰 delta clamp
11. reset
12. 중복 tick 방지

## 21.6 AlertManager

1. BAD 14.9초 → 경고 없음
2. BAD 15초 → 경고 1회
3. 120초 안 동일 경고 없음
4. 쿨다운 후 재경고
5. BAD가 중간에 끊기면 지속시간 reset
6. AWAY에서 경고 없음
7. PAUSED에서 경고 없음
8. DARK 경고
9. 조도 쿨다운 60초

## 21.7 모드 전환

1. AI → MOCK 전환 시 AI buffer reset
2. MOCK → AI 전환 시 Mock 상태가 남지 않음
3. 두 모드가 동시에 타이머를 tick하지 않음
4. 모델 오류 후 명시적 Mock 전환

기존 Phase 1~3 테스트도 모두 계속 통과해야 한다.

---

# 22. 통합 테스트와 수동 검증

## 실제 AI 모드

```text
[ ] 정상 자세를 유지하면 안정화 후 STUDYING
[ ] 정상 자세 전환 직후 바로 바뀌지 않음
[ ] 앞으로 숙인 상태를 유지하면 안정화 후 POSTURE_CAUTION
[ ] 한두 프레임 오분류로 화면이 깜빡이지 않음
[ ] 옆으로 기울이면 SIDE 관련 원인 표시
[ ] 엎드리면 RESTING 관련 원인 표시
[ ] 사람 사라짐 2.5초 전에는 AWAY가 아님
[ ] 2.5초 후 AWAY
[ ] 돌아오자마자 즉시 STUDYING이 되지 않음
[ ] TM 신뢰도 낮으면 CHECKING
[ ] 카메라를 끄면 마지막 GOOD이 계속 사용되지 않음
```

## 조도

```text
[ ] 620 Lux 안정화 후 RECOMMENDED
[ ] 200 Lux로 바꾼 직후 바로 변경되지 않음
[ ] 3초 후 LUX_CAUTION
[ ] GOOD + 200 Lux에서 순공 정지
[ ] 조도 반영 OFF 시 GOOD이면 순공 증가
[ ] 1200 Lux에서 밝음 경고
```

## 타이머

```text
[ ] 기본 화면에 순공 시간 크게 표시
[ ] AWAY 시간 기본 숨김
[ ] 설정 ON 시 AWAY 시간 표시
[ ] 수동 PAUSE 시 모든 시간 정지
[ ] 재개 시 큰 시간 점프 없음
[ ] Mock과 AI가 동시에 증가시키지 않음
```

## 경고

```text
[ ] BAD 15초 전 경고 없음
[ ] 15초 후 1회 경고
[ ] 같은 경고가 계속 반복되지 않음
[ ] 조도 경고 쿨다운 작동
```

## 회귀

```text
[ ] 카메라 스트림 1개
[ ] MediaPipe 관절 오버레이 정상
[ ] TM 원시 확률 패널 정상
[ ] 캘리브레이션 정상
[ ] 그룹 버튼 disabled
[ ] 모바일 360px 가로 overflow 없음
```

---

# 23. Vercel Preview 검증

Phase 4 완료 후 실제 Preview Deployment에서 확인한다.

필수 확인:

1. `/app` 직접 접근
2. 카메라 권한 요청
3. MediaPipe 모델 로딩
4. TM Pose 모델 로딩
5. 캘리브레이션
6. AI 모드 선택
7. 실제 자세로 상태 변화
8. 실제 순공 타이머 자동 증가·정지
9. 조도 슬라이더와 타이머 연동
10. 페이지 이동 시 카메라 종료
11. 새로고침 시 SPA 404 없음
12. 콘솔 error 없음
13. 외부 CDN 요청 없음

Preview URL을 완료 보고에 포함한다.

---

# 24. 문서 갱신

README에 다음을 추가한다.

- AI 모드와 Mock 모드 설명
- 실제 순공 시간 계산 조건
- 상태 안정화 방식
- GOOD/BAD/AWAY 확정 시간
- 조도 반영 설정
- 경고와 쿨다운
- 파일럿 모델 한계
- 개인정보 처리
- 카메라·AI 문제 해결법

문구:

```text
studylog의 순공 시간은 실제 집중력을 측정한 값이 아니라,
착석·자세·조도 조건을 충족한 시간을 의미합니다.
```

---

# 25. 완료 조건

아래 조건이 모두 충족돼야 Phase 4 완료다.

1. Phase 2 MediaPipe 신호와 Phase 3 TM 예측을 융합
2. freshness 검증
3. TM 낮은 신뢰도 UNKNOWN
4. GOOD/BAD 다수결 12개 중 8개
5. GOOD 1.5초
6. BAD 3초
7. AWAY 2.5초
8. UNKNOWN grace 2초
9. Lux 3초 안정화
10. StudyStatusResolver
11. 실제 AI 모드에서 SessionTimer 제어
12. Mock 모드 유지
13. 두 모드 동시 제어 없음
14. 순공 시간 기본 표시
15. 자리 비움 시간 기본 숨김
16. 조도 반영 설정
17. 자세 15초 경고
18. 자세 쿨다운 120초
19. 조도 경고와 쿨다운
20. 카메라 종료 후 stale GOOD 사용 안 함
21. 새 세션 reset
22. 수동 pause 정확히 작동
23. 모든 신규 테스트 통과
24. 기존 테스트 회귀 없음
25. lint 경고 0
26. production build 성공
27. Vercel Preview 실제 검증
28. 그룹 기능 변경 없음
29. 영상·이미지 저장 없음
30. Phase 5 미구현 상태로 종료

---

# 26. 완료 보고 형식

구현 후 아래 형식으로 보고한다.

## 브랜치와 PR

## 구현 기능

## 기존 구조에서 재사용·리팩터링한 부분

## 생성·변경 파일

## 핵심 타입

## Fusion 규칙

## 상태 안정화 규칙

## 타이머 누적 규칙

## AI/Mock 모드 분리 방식

## 경고와 쿨다운

## 실행한 명령

```text
npm run lint
npm run test
npm run build
```

## 테스트 결과

## 실제 브라우저 검증 결과

## Vercel Preview URL

## 파일럿 모델에서 확인된 제한

## 남은 TODO

## Phase 5 전에 사용자가 확인할 항목

Phase 5는 임의로 시작하지 말고 완료 보고 후 중단한다.

---

# 27. 지금 수행할 명령

먼저 계획을 보고한 뒤 구현한다.

최종 검증 시 반드시 실행한다.

```bash
npm run lint
npm run test
npm run build
```

TypeScript 전용 검사 스크립트가 있다면 함께 실행한다.

Phase 4 완료 후 PR을 생성하되, Phase 5 작업은 시작하지 않는다.
