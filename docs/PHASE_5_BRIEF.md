# studylog Phase 5 — 세션 기록·IndexedDB·평가 데이터·CSV·리포트 구현 지시서

## 0. 역할과 작업 원칙

당신은 `studylog` 프로젝트의 Phase 5를 구현하는 시니어 React·TypeScript·브라우저 데이터 아키텍처 개발자다.

이번 작업의 핵심은 Phase 4에서 완성된 실시간 AI 런타임 결과를 **재현 가능하고 분석 가능한 데이터**로 저장하고, 사용자가 실제 기록·리포트·CSV를 확인할 수 있게 만드는 것이다.

작업을 시작하기 전에 반드시 아래 문서를 끝까지 읽는다.

- `AGENTS.md`
- `docs/PROJECT_BRIEF.md`
- `docs/PHASE_2_BRIEF.md`
- `docs/PHASE_3_BRIEF.md`
- `docs/PHASE_4_BRIEF.md`

그리고 현재 저장소의 실제 코드를 먼저 확인한다.

특히 아래 구현의 실제 이름과 책임을 파악한다.

- `StudyRuntimeController`
- `PostureFusionEngine`
- `PostureStateMachine`
- `LuxStateMachine`
- `StudyStatusResolver`
- `AlertManager`
- `SessionTimer`
- `useStudySessionStore`
- `useStudySettingsStore`
- `RuntimeSnapshot`
- `SessionDurations`
- Phase 3의 Teachable Machine Pose 원시 예측 store 또는 hook
- Phase 2의 MediaPipe signal store 또는 hook
- `/app`의 세션 시작·일시정지·종료 흐름
- `/app/records`
- `/report/:sessionId`
- `/evaluate`

기존 책임과 겹치는 클래스를 중복 생성하지 않는다. 기존 구조가 적절하면 확장하고, 구조적 문제가 있을 때만 작게 리팩터링한다.

### Git 작업

Phase 4 PR이 아직 Draft이거나 main에 병합되지 않았다면 먼저 보고한다.

Phase 4의 lint, test, typecheck, build가 통과하고 수동 검증이 끝난 경우:

1. Phase 4 PR을 Ready for review로 전환한다.
2. main에 Squash and merge 한다.
3. 최신 main을 checkout/pull 한다.
4. 아래 브랜치를 생성한다.

```text
agent/studylog-phase-5-data-reporting
```

이 문서는 프로젝트에 아래 경로로 저장한다.

```text
docs/PHASE_5_BRIEF.md
```

코드를 바로 작성하지 말고 먼저 다음 내용을 보고한다.

1. 현재 브랜치와 Phase 4 PR/main 상태
2. Phase 4 실제 구현 구조 분석
3. 세션 시작·일시정지·종료의 현재 호출 흐름
4. Phase 5에서 재사용할 클래스와 리팩터링할 클래스
5. IndexedDB 스키마 설계
6. 세션 샘플링·저장 생명주기
7. 평가 데이터 수집 방식
8. CSV 스키마와 파일명 규칙
9. 기록·리포트 페이지 구현 계획
10. 설치할 패키지와 정확한 버전 결정 방식
11. 생성·변경할 파일 목록
12. 기존 기능 회귀 위험
13. 테스트 계획
14. Phase 5 완료 기준

계획을 먼저 보고한 뒤 Phase 5만 구현한다. Phase 6 Python 분석이나 Phase 7 최종 모델 교체를 임의로 시작하지 않는다.

---

# 1. Phase 5 목표

Phase 4에서 다음 런타임이 완성되어 있다.

```text
MediaPipe + Teachable Machine Pose
        ↓
PostureFusionEngine
        ↓
PostureStateMachine
        ↓
StablePostureState
        +
LuxStateMachine
        ↓
StudyStatus + SessionTimer
```

Phase 5에서는 이 결과를 다음 흐름으로 연결한다.

```text
실시간 런타임 결과
        ↓
1초 단위 SessionSample 생성
        ↓
IndexedDB 로컬 저장
        ↓
SessionSummary 확정
        ↓
기록 페이지 / 상세 리포트
        ↓
CSV 내보내기
        ↓
Phase 6 Python 분석의 입력 데이터
```

반드시 구현할 항목:

1. 버전이 명시된 IndexedDB 스키마
2. 세션 요약 저장
3. 1초 단위 세션 샘플 저장
4. 세션 시작·일시정지·재개·종료 연동
5. 비정상 종료 세션 복구 또는 정리 UX
6. 실제 기록 페이지
7. 세션 상세 리포트
8. 세션 상세 CSV 및 요약 CSV
9. AI 모델 평가 페이지 완성
10. 평가 결과 IndexedDB 저장
11. 평가 CSV 내보내기
12. 기본 정확도·혼동행렬 요약 UI
13. 로컬 데이터 삭제 기능
14. 모바일·PC 반응형
15. 데이터 저장 오류 및 용량 오류 처리
16. 단위·통합 테스트
17. Vercel Preview 검증

---

# 2. 이번 Phase에서 하지 않을 것

다음 기능은 구현하지 않는다.

- Python 데이터 분석 프로그램
- pandas, scikit-learn, matplotlib 코드
- 최종 Teachable Machine v2 모델 교체
- 모델 재학습
- AI 임계값의 최종 실험 조정
- PWA 완성
- 서버 API
- 로그인·회원가입
- Supabase·Firebase
- 클라우드 동기화
- 실제 그룹 생성·입장·초대
- 다른 사용자의 실시간 상태
- PDF 리포트 생성
- 원본 영상·사진 저장
- 원본 MediaPipe 랜드마크 배열 저장
- 얼굴 식별
- 의료적 자세 진단

Phase 6에서 Python 객체지향 분석 프로그램을 구현한다.

---

# 3. 반드시 유지할 불변 조건

1. 카메라 MediaStream은 하나만 유지한다.
2. MediaPipe와 TM Pose는 같은 video element를 공유한다.
3. 원본 영상·이미지 프레임을 저장하거나 전송하지 않는다.
4. 원본 관절 배열을 IndexedDB·CSV에 저장하지 않는다.
5. 저장되는 데이터는 자세 상태·신뢰도·편차 점수·조도·시간 통계뿐이다.
6. AI 모드와 Mock 모드는 동시에 타이머나 기록을 제어하지 않는다.
7. Mock 기록은 실제 AI 기록과 구분한다.
8. Mock 기록은 기본 통계에서 제외한다.
9. 자리 비움 시간은 계속 기록하지만 기본 화면에서는 숨긴다.
10. 수동 PAUSED 시간은 `totalSessionMs`에 포함하지 않는다.
11. AWAY 시간은 RUNNING 세션의 `totalSessionMs`에는 포함한다.
12. `postureCautionMs`와 `luxCautionMs`는 동시에 증가할 수 있다.
13. 세부 시간들의 합이 반드시 전체 시간과 같다고 가정하지 않는다.
14. IndexedDB 오류가 AI 런타임 전체를 중단시키면 안 된다.
15. 저장 실패 시 사용자에게 명확히 알리고 최소한 현재 메모리 타이머는 유지한다.
16. 저장된 데이터가 없을 때 가짜 기록을 표시하지 않는다.
17. 그룹 페이지의 더미 UI 범위는 변경하지 않는다.

---

# 4. 의존성

현재 패키지와 호환되는 정확한 버전을 확인하고 고정한다.

권장 추가 패키지:

```text
idb
recharts
```

테스트 환경:

```text
fake-indexeddb
```

원칙:

1. 무조건 latest 범위를 남기지 않는다.
2. 실제 `npm run typecheck`, `npm run test`, `npm run build`가 통과한 버전을 package.json과 lockfile에 고정한다.
3. IndexedDB wrapper는 `idb` 하나만 사용한다.
4. 차트는 `recharts` 하나만 사용한다.
5. 기존 shadcn/ui, Tailwind, Lucide 구조를 유지한다.
6. 외부 CDN을 추가하지 않는다.

---

# 5. 권장 폴더 구조

기존 구조를 먼저 확인하고 naming convention에 맞춘다.

```text
src/
├─ data/
│  ├─ db/
│  │  ├─ studylog-db.ts
│  │  ├─ db-schema.ts
│  │  └─ db-errors.ts
│  │
│  ├─ repositories/
│  │  ├─ SessionRepository.ts
│  │  ├─ EvaluationRepository.ts
│  │  └─ repository-types.ts
│  │
│  ├─ session/
│  │  ├─ SessionRecorder.ts
│  │  ├─ SessionSummaryBuilder.ts
│  │  ├─ SessionAnalytics.ts
│  │  ├─ session-data-types.ts
│  │  └─ session-data-config.ts
│  │
│  ├─ evaluation/
│  │  ├─ EvaluationRunner.ts
│  │  ├─ EvaluationAnalytics.ts
│  │  └─ evaluation-types.ts
│  │
│  └─ export/
│     ├─ CsvExporter.ts
│     ├─ csv-schemas.ts
│     └─ download-file.ts
│
├─ hooks/
│  ├─ useSessionRecorder.ts
│  ├─ useSessionRecords.ts
│  ├─ useSessionReport.ts
│  └─ useEvaluationRecords.ts
│
├─ components/
│  ├─ records/
│  ├─ report/
│  ├─ evaluation/
│  └─ charts/
│
└─ pages/
   ├─ records/
   ├─ report/
   └─ evaluation/
```

기존 `src/session/SessionTimer.ts`는 시간 누적 책임을 그대로 유지한다.

`SessionRecorder`가 `SessionTimer`를 대체하거나 시간을 다시 계산하면 안 된다.

---

# 6. 데이터 스키마 버전

모든 영속 데이터와 CSV에 스키마 버전을 명시한다.

```ts
export const DATA_SCHEMA_VERSION = 1 as const;
```

모델 버전과 데이터 스키마 버전은 다른 개념이다.

```text
schemaVersion
→ 저장 데이터 구조 버전

modelVersion
→ Teachable Machine 모델 버전
```

---

# 7. 세션 종류

AI와 Mock 기록을 구분한다.

```ts
export type SessionKind = 'AI' | 'MOCK' | 'MIXED';
```

판정 규칙:

- 세션 동안 AI 모드만 사용: `AI`
- 세션 동안 Mock 모드만 사용: `MOCK`
- 세션 도중 모드가 변경됨: `MIXED`

기록 페이지 기본 필터:

```text
AI 세션만 표시
```

사용자가 명시적으로 `데모 기록 포함`을 켜면 MOCK과 MIXED를 함께 볼 수 있다.

가짜·데모 기록이 실제 학습 통계를 오염시키지 않게 한다.

---

# 8. 세션 상태

영속 세션 상태를 별도로 정의한다.

```ts
export type StoredSessionStatus =
  | 'ACTIVE'
  | 'COMPLETED'
  | 'INTERRUPTED'
  | 'DISCARDED';
```

의미:

- `ACTIVE`: 시작됐지만 정상 종료되지 않은 세션
- `COMPLETED`: 사용자가 종료 버튼으로 정상 종료
- `INTERRUPTED`: 새로고침·탭 종료 등으로 끝난 세션을 다음 실행에서 정리
- `DISCARDED`: 사용자가 기록을 버리기로 선택

`DISCARDED`는 기본 조회와 통계에서 제외한다.

---

# 9. SessionSample 타입

세션 중 1초마다 저장하는 분석용 표본이다.

필드 이름은 Python 분석과 CSV 호환성을 고려해 안정적으로 유지한다.

```ts
export interface SessionSample {
  schemaVersion: 1;

  id: string;
  sessionId: string;
  sequence: number;

  timestampIso: string;
  elapsedMs: number;

  subject: string | null;
  goalMinutes: number;
  sessionKind: SessionKind;
  controlMode: RuntimeControlMode;
  lifecycle: SessionLifecycle;

  stablePostureState: StablePostureState;
  badPostureReason: BadPostureReason | null;
  rawPostureState: RawPostureState | null;
  studyStatus: StudyStatus;

  runtimeReady: boolean;
  blockingReason: RuntimeBlockingReason | null;
  effectiveTimeEligible: boolean;

  tmLabel: TmPoseLabel | null;
  tmConfidence: number | null;
  tmGoodProbability: number | null;
  tmForwardProbability: number | null;
  tmSideProbability: number | null;
  tmRestingProbability: number | null;
  tmFresh: boolean;

  poseDetected: boolean;
  mediaPipeFresh: boolean;
  deviationScore: number | null;
  deviationReasons: DeviationReason[];

  lux: number;
  luxStatus: LuxStatus;

  totalSessionMs: number;
  effectiveStudyMs: number;
  seatedMs: number;
  postureCautionMs: number;
  awayMs: number;
  luxCautionMs: number;
  checkingMs: number;

  modelVersion: string | null;
  calibrationProfileId: string | null;
}
```

규칙:

1. 값이 없으면 0으로 속이지 말고 `null`을 사용한다.
2. probability는 0~1 범위다.
3. `lux`는 유한한 숫자인지 검증한다.
4. `sequence`는 세션별 0부터 단조 증가한다.
5. `timestampIso`는 ISO 8601 문자열이다.
6. `elapsedMs`는 세션 RUNNING 누적 시간 기준이다.
7. 배열은 DB에서는 배열로 저장할 수 있지만 CSV에서는 `|`로 연결한다.
8. 원본 랜드마크는 포함하지 않는다.

---

# 10. SessionSummary 타입

```ts
export interface SessionSummary {
  schemaVersion: 1;

  id: string;
  status: StoredSessionStatus;
  sessionKind: SessionKind;

  subject: string | null;
  goalMinutes: number;

  startedAtIso: string;
  endedAtIso: string | null;
  localDateKey: string;
  timezoneOffsetMinutes: number;

  initialControlMode: RuntimeControlMode;
  controlModesUsed: RuntimeControlMode[];
  countLuxInEffectiveTime: boolean;

  modelVersions: string[];
  calibrationProfileId: string | null;

  totalSessionMs: number;
  effectiveStudyMs: number;
  seatedMs: number;
  postureCautionMs: number;
  awayMs: number;
  luxCautionMs: number;
  checkingMs: number;

  goodPostureRatio: number | null;
  recommendedLuxRatio: number | null;
  effectiveStudyRatio: number | null;
  goalProgressRatio: number;

  averageLux: number | null;
  minimumLux: number | null;
  maximumLux: number | null;

  dominantBadPostureReason: BadPostureReason | null;
  sampleCount: number;

  createdAtIso: string;
  updatedAtIso: string;
}
```

비율 정의:

```text
goodPostureMs
= max(0, seatedMs - postureCautionMs)

goodPostureRatio
= seatedMs > 0 ? goodPostureMs / seatedMs : null

recommendedLuxMs
= max(0, seatedMs - luxCautionMs)

recommendedLuxRatio
= seatedMs > 0 ? recommendedLuxMs / seatedMs : null

effectiveStudyRatio
= totalSessionMs > 0 ? effectiveStudyMs / totalSessionMs : null

goalProgressRatio
= effectiveStudyMs / (goalMinutes * 60_000)
```

UI에서는 목표 달성률을 100%로 cap할 수 있지만, 저장값은 1을 초과할 수 있다.

---

# 11. EvaluationRecord 타입

AI 모델 자체의 분류 성능을 평가하기 위한 기록이다.

```ts
export type EvaluationLightingCondition =
  | 'BRIGHT'
  | 'NORMAL'
  | 'DIM';

export type EvaluationCameraDistance =
  | 'NEAR'
  | 'NORMAL'
  | 'FAR';

export interface EvaluationRecord {
  schemaVersion: 1;

  id: string;
  createdAtIso: string;

  participantCode: string;
  actualLabel: TmPoseLabel;
  predictedLabel: TmPoseLabel;
  correct: boolean;

  averageConfidence: number;
  averageGoodProbability: number;
  averageForwardProbability: number;
  averageSideProbability: number;
  averageRestingProbability: number;

  validSampleCount: number;
  rejectedSampleCount: number;
  collectionDurationMs: number;

  modelVersion: string;
  mirrorCamera: boolean;
  lightingCondition: EvaluationLightingCondition;
  cameraDistance: EvaluationCameraDistance;
  environmentNote: string;
}
```

참여자 코드는 개인정보를 피하기 위해 아래 형식을 권장한다.

```text
P01
P02
P03
```

실명은 필수로 저장하지 않는다.

---

# 12. IndexedDB 스키마

DB 이름:

```text
studylog-db
```

초기 DB 버전:

```text
1
```

object store:

```text
sessions
sessionSamples
evaluationRecords
```

## sessions

```text
keyPath: id
```

indices:

```text
by-status
by-started-at
by-local-date
by-subject
by-session-kind
```

## sessionSamples

권장 keyPath:

```text
id
```

`id` 형식:

```text
${sessionId}:${sequence}
```

indices:

```text
by-session-id
by-session-and-sequence
by-timestamp
```

가능하면 `by-session-and-sequence`는 compound index로 만든다.

## evaluationRecords

```text
keyPath: id
```

indices:

```text
by-created-at
by-participant-code
by-actual-label
by-model-version
```

업그레이드 함수는 version별 분기로 작성한다.

```ts
if (oldVersion < 1) {
  // create stores and indices
}
```

향후 migration을 추가할 수 있는 구조로 만든다.

---

# 13. DB 경계 검증

Zod를 사용해 DB에 쓰기 전과 읽은 후 핵심 데이터 구조를 검증한다.

원칙:

1. 저장 전 NaN, Infinity 제거
2. 잘못된 enum 값 거부
3. 누락 필드는 명확한 오류
4. 이전 버전 데이터는 migration 또는 오류 안내
5. UI 컴포넌트에서 IndexedDB 원시 API 직접 호출 금지

DB 오류 타입 예시:

```ts
export type StudylogDbErrorCode =
  | 'UNAVAILABLE'
  | 'OPEN_FAILED'
  | 'QUOTA_EXCEEDED'
  | 'VALIDATION_FAILED'
  | 'TRANSACTION_FAILED'
  | 'NOT_FOUND'
  | 'UNKNOWN';
```

사용자에게 원본 DOMException을 그대로 노출하지 않는다.

---

# 14. Repository 인터페이스

## SessionRepository

```ts
export interface SessionRepository {
  createSession(summary: SessionSummary): Promise<void>;
  updateSession(summary: SessionSummary): Promise<void>;
  getSession(id: string): Promise<SessionSummary | null>;
  listSessions(query?: SessionQuery): Promise<SessionSummary[]>;

  appendSample(sample: SessionSample): Promise<void>;
  appendSamples(samples: SessionSample[]): Promise<void>;
  getSamples(sessionId: string): Promise<SessionSample[]>;

  findActiveSession(): Promise<SessionSummary | null>;
  deleteSession(id: string): Promise<void>;
  clearAllSessions(): Promise<void>;
}
```

`deleteSession`은 summary와 해당 session samples를 하나의 transaction에서 삭제한다.

## EvaluationRepository

```ts
export interface EvaluationRepository {
  add(record: EvaluationRecord): Promise<void>;
  list(): Promise<EvaluationRecord[]>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}
```

Repository 구현은 singleton으로 전역 고정하지 않아도 되지만 DB connection 중복 open은 피한다.

테스트에서는 in-memory/fake IndexedDB를 주입할 수 있게 한다.

---

# 15. SessionRecorder 책임

`SessionRecorder`는 런타임 결과를 데이터 샘플로 변환하고 저장한다.

```ts
export class SessionRecorder {
  start(context: SessionStartContext): Promise<string>;
  sample(snapshot: SessionRecordingSnapshot): Promise<void>;
  checkpoint(snapshot: SessionRecordingSnapshot): Promise<void>;
  pause(snapshot: SessionRecordingSnapshot): Promise<void>;
  resume(snapshot: SessionRecordingSnapshot): Promise<void>;
  finish(snapshot: SessionRecordingSnapshot): Promise<SessionSummary>;
  discard(): Promise<void>;
  dispose(): Promise<void>;
}
```

책임:

- 세션 ID 생성
- sequence 증가
- 세션 종류 AI/MOCK/MIXED 추적
- modelVersion 목록 추적
- 1초 샘플 저장
- 현재 durations checkpoint
- 종료 summary 생성
- 중복 저장 방지
- 비동기 write 직렬화
- 저장 오류 상태 제공

책임이 아닌 것:

- 자세 판정
- 타이머 계산
- AI 추론
- UI 렌더링

---

# 16. 세션 ID

가능하면 사용한다.

```ts
crypto.randomUUID()
```

지원하지 않는 환경에는 충돌 가능성이 낮은 fallback을 제공한다.

세션 ID에 사용자 실명이나 과목명을 포함하지 않는다.

---

# 17. 세션 시작 연동

기존 `startSession()` 의미를 확인한다.

일반적으로:

```text
IDLE 또는 FINISHED → RUNNING
= 새 세션 시작

PAUSED → RUNNING
= 기존 세션 재개
```

새 세션 시작 시 즉시 `ACTIVE` SessionSummary를 IndexedDB에 저장한다.

초기값:

- `startedAtIso`: 현재 시각
- `endedAtIso`: null
- durations: 모두 0
- `sampleCount`: 0
- `initialControlMode`: 현재 control mode
- `controlModesUsed`: 현재 mode 1개
- `modelVersions`: 현재 모델 버전이 있으면 포함
- `calibrationProfileId`: 현재 캘리브레이션 ID 또는 null

IndexedDB 저장이 실패해도 사용자가 세션을 시작할 수는 있어야 한다.

하지만 다음 경고를 표시한다.

```text
이 세션은 현재 브라우저에 저장되지 않을 수 있습니다.
타이머는 계속 사용할 수 있습니다.
```

---

# 18. 샘플링 주기

세션 샘플은 AI 추론 빈도와 분리한다.

```text
SessionSample 저장: 1초에 1회
```

조건:

- lifecycle가 RUNNING일 때만 새 sample 저장
- PAUSED에서는 새 sample을 만들지 않음
- FINISHED에서 마지막 checkpoint 후 종료
- 같은 초에 중복 sequence 저장 금지
- 이전 write가 끝나지 않았으면 queue에서 직렬화
- 탭이 hidden이어도 세션이 RUNNING이면 브라우저 timer 제한을 고려해 다음 tick에서 큰 gap을 여러 샘플로 가짜 보간하지 않음

중요:

`SessionTimer`의 실제 durations를 그대로 저장한다.

샘플 누락을 채우기 위해 과거 시간을 임의로 복제하지 않는다.

---

# 19. SessionRecordingSnapshot

UI store 전체를 통째로 전달하지 말고 필요한 값만 명시적으로 구성한다.

```ts
export interface SessionRecordingSnapshot {
  nowIso: string;
  elapsedMs: number;

  lifecycle: SessionLifecycle;
  subject: string | null;
  goalMinutes: number;

  controlMode: RuntimeControlMode;
  countLuxInEffectiveTime: boolean;

  runtimeSnapshot: RuntimeSnapshot | null;
  durations: SessionDurations;

  rawLux: number;
  tmPrediction: TmPoseSignal | null;…3 tokens truncated…Signal: MediaPipePostureSignal | null;

  modelVersion: string | null;
  calibrationProfileId: string | null;
}
```

샘플 생성 로직은 테스트 가능한 pure mapper로 분리한다.

```ts
buildSessionSample(context, snapshot, sequence): SessionSample
```

---

# 20. 세션 종료

사용자가 종료를 누르면:

1. SessionTimer가 더 이상 증가하지 않게 FINISHED로 전환
2. 마지막 checkpoint 저장
3. sample 조회 또는 누적 analytics를 이용해 summary 확정
4. status `COMPLETED`
5. endedAtIso 기록
6. repository update
7. 성공 시 `/report/:sessionId`로 이동
8. 저장 실패 시 재시도 UI

`finishSession()` 호출과 route navigation이 경쟁하지 않게 한다.

종료 버튼을 여러 번 눌러도 세션이 중복 저장되지 않게 한다.

---

# 21. 초기화·기록 버리기

사용자가 진행 중 세션을 초기화하려 하면 확인 Dialog를 띄운다.

선택지:

```text
기록을 저장하고 종료
기록을 버리고 초기화
취소
```

기록을 버리면:

- status `DISCARDED` 또는 완전 삭제 중 하나를 프로젝트 정책으로 선택
- 기본 조회에는 표시하지 않음
- 관련 samples 처리 일관성 유지

정책을 README에 문서화한다.

---

# 22. 비정상 종료 복구

앱 진입 시 `ACTIVE` 세션을 찾는다.

ACTIVE 세션이 있으면 자동으로 타이머를 재개하지 않는다.

Dialog:

```text
이전 세션이 정상적으로 종료되지 않았습니다.
마지막 저장 시점까지의 기록을 보관할까요?
```

선택지:

```text
중단된 기록으로 보관
기록 삭제
```

`중단된 기록으로 보관`:

- status `INTERRUPTED`
- endedAtIso는 마지막 sample timestamp 또는 현재 시각 중 더 논리적인 값을 선택
- 저장된 마지막 durations로 summary 확정

`기록 삭제`:

- session summary와 samples 삭제

복구 기능이 카메라 권한 요청 전에 동작해도 된다.

---

# 23. 페이지 종료 처리

`beforeunload`에서 비동기 IndexedDB 완료를 보장한다고 가정하지 않는다.

대신:

- 1초 단위 저장으로 손실 범위를 줄임
- lifecycle 변화마다 checkpoint
- ACTIVE 세션 복구 제공
- `pagehide`에서 best-effort checkpoint 가능

`sendBeacon`이나 서버 API를 사용하지 않는다.

---

# 24. SessionSummaryBuilder

summary 계산은 UI에서 하지 않는다.

```ts
export class SessionSummaryBuilder {
  build(input: SessionSummaryBuildInput): SessionSummary;
}
```

계산 항목:

- durations
- 비율
- 평균·최소·최대 Lux
- dominant bad reason
- sample count
- model versions
- control modes used
- session kind

Lux 평균은 유효한 numeric Lux sample만 사용한다.

bad reason은 null을 제외하고 가장 많이 나온 값을 선택한다.

동률이면 명확한 deterministic rule을 사용한다.

---

# 25. 기록 페이지 `/app/records`

현재 Empty State를 실제 데이터 기반 화면으로 교체한다.

기본 요구사항:

1. IndexedDB session summaries 조회
2. 기본적으로 COMPLETED·INTERRUPTED AI 세션만 표시
3. MOCK·MIXED 포함 switch 제공
4. DISCARDED 제외
5. 최근 세션 목록
6. 각 세션을 `/report/:sessionId`로 연결
7. 일간·주간·과목별 탭
8. 실제 데이터만 표시
9. 데이터 없음 Empty State 유지
10. 로딩·오류 상태 표시

## 요약 카드

- 순공 시간
- 목표 달성률
- 적정 조도 유지율
- 기준 자세 유지율

선택 범위에 따라 집계한다.

## 일간

- 날짜 선택
- 해당 날짜 세션 총합
- 세션 목록

## 주간

- 월요일~일요일
- 일별 순공 시간 막대그래프
- 주간 총합

## 과목별

- 과목별 순공 시간
- 과목별 세션 수
- 도넛 또는 막대 차트

시간 집계는 ms 정수로 계산하고 UI에서만 포맷한다.

---

# 26. 기록 집계 규칙

로컬 날짜를 사용한다.

```text
localDateKey: YYYY-MM-DD
```

주의:

- `toISOString().slice(0, 10)`만 사용하면 한국 시간 자정 근처에서 날짜가 달라질 수 있다.
- 로컬 timezone을 고려한 helper를 만든다.
- week는 월요일 시작으로 정의한다.

집계 pure 함수/클래스:

```ts
export class SessionAnalytics {
  aggregateDaily(...)
  aggregateWeekly(...)
  aggregateBySubject(...)
}
```

단위 테스트를 작성한다.

---

# 27. 상세 리포트 `/report/:sessionId`

기존 placeholder를 실제 페이지로 교체한다.

페이지 상태:

- LOADING
- READY
- NOT_FOUND
- ERROR

기본 표시:

- 과목
- 시작·종료 시각
- 세션 종류 AI/MOCK/MIXED Badge
- 완료·중단 상태
- 순공 시간
- 전체 세션 시간
- 목표 달성률
- 기준 자세 유지율
- 적정 조도 유지율

## 차트

1. 시간대별 안정 자세/사용자 상태 타임라인
2. Lux 변화 선 그래프
3. 자세 상태 분포
4. 조도 상태 분포

Recharts를 사용한다.

모바일에서는 차트가 가로 overflow를 만들지 않아야 한다.

`ResponsiveContainer`를 사용하고 부모 높이를 명시한다.

## 상세 시간

기본적으로 접힌 Accordion에 둔다.

- 전체 세션 시간
- 자세 주의 시간
- 자리 비움 시간
- 조도 주의 시간
- 확인 중 시간

사용자 timer visibility 설정을 참고할 수 있지만, 리포트의 상세 기록은 명시적으로 펼쳐볼 수 있어야 한다.

중요 문구:

```text
자세 주의 시간과 조도 주의 시간은 동시에 기록될 수 있어
각 항목의 합이 전체 세션 시간과 같지 않을 수 있습니다.
```

---

# 28. 리포트 CSV 버튼

리포트에 아래 버튼을 제공한다.

```text
상세 데이터 CSV
요약 CSV
```

다운로드 전 repository에서 최신 데이터를 읽는다.

메모리 UI 상태만으로 CSV를 만들지 않는다.

---

# 29. CSV 공통 규칙

RFC 4180에 맞는 escaping을 구현한다.

필수:

- comma 포함 값 quote
- quote 문자는 두 번 escape
- newline 포함 값 quote
- `\r\n` line ending 사용 가능
- UTF-8 BOM 추가
- 한국어가 Excel에서 깨지지 않게 함
- 숫자는 locale string이 아닌 raw number
- null은 빈 문자열
- boolean은 `true`/`false`
- 배열은 `|` 구분 문자열
- Date는 ISO 문자열

`CsvExporter`는 DOM에 직접 의존하지 않는 pure class로 만든다.

파일 다운로드 책임은 별도 helper에 둔다.

---

# 30. 세션 상세 CSV 컬럼

고정 순서:

```text
schema_version
session_id
sequence
timestamp_iso
elapsed_ms
subject
goal_minutes
session_kind
control_mode
lifecycle
stable_posture_state
bad_posture_reason
raw_posture_state
study_status
runtime_ready
blocking_reason
effective_time_eligible
tm_label
tm_confidence
tm_good_probability
tm_forward_probability
tm_side_probability
tm_resting_probability
tm_fresh
pose_detected
mediapipe_fresh
deviation_score
deviation_reasons
lux
lux_status
total_session_ms
effective_study_ms
seated_ms
posture_caution_ms
away_ms
lux_caution_ms
checking_ms
model_version
calibration_profile_id
```

파일명:

```text
studylog-session-{localDateKey}-{shortSessionId}-samples.csv
```

---

# 31. 세션 요약 CSV 컬럼

```text
schema_version
session_id
status
session_kind
subject
goal_minutes
started_at_iso
ended_at_iso
local_date_key
timezone_offset_minutes
initial_control_mode
control_modes_used
count_lux_in_effective_time
model_versions
calibration_profile_id
total_session_ms
effective_study_ms
seated_ms
posture_caution_ms
away_ms
lux_caution_ms
checking_ms
good_posture_ratio
recommended_lux_ratio
effective_study_ratio
goal_progress_ratio
average_lux
minimum_lux
maximum_lux
dominant_bad_posture_reason
sample_count
```

파일명:

```text
studylog-session-{localDateKey}-{shortSessionId}-summary.csv
```

---

# 32. AI 평가 페이지 `/evaluate`

현재 원시 확률 확인 페이지를 실제 평가 도구로 확장한다.

이 페이지는 공부 세션과 독립적이다.

평가 도중 `SessionTimer`나 `StudyRuntimeController`의 사용자 세션을 시작하지 않는다.

## 입력 UI

- 참여자 코드
- 실제 자세 라벨
- 조명 조건
- 카메라 거리
- 환경 메모

참여자 코드 preset:

```text
P01
P02
P03
```

라벨:

```text
GOOD_POSTURE
FORWARD_LEAN
SIDE_LEAN
RESTING
```

한국어 설명도 함께 표시한다.

---

# 33. 평가 실행 흐름

```text
1. 카메라와 TM Pose 모델 준비 확인
2. 실제 라벨 선택
3. 3초 카운트다운
4. 3초 동안 fresh TM prediction 수집
5. timestamp 중복 제거
6. 최소 유효 샘플 수 확인
7. 클래스별 평균 probability 계산
8. 평균 probability가 가장 높은 클래스를 최종 예측으로 선택
9. 정답 여부 계산
10. IndexedDB 저장
11. 결과 카드 표시
```

초기 최소 유효 샘플:

```text
5개
```

TM 예측 주기가 약 2.5Hz라면 3초 동안 대략 7개 전후를 기대할 수 있다.

freshness 기준은 Phase 4 설정을 재사용한다.

오래된 예측을 반복해서 여러 샘플로 세지 않는다.

---

# 34. 평가 평균 계산

각 유효 prediction의 네 클래스 probability를 평균낸다.

```ts
averageGoodProbability
averageForwardProbability
averageSideProbability
averageRestingProbability
```

최종 예측:

```text
평균 probability가 가장 큰 클래스
```

`averageConfidence`:

```text
최종 예측 클래스의 평균 probability
```

단순히 마지막 프레임을 최종 결과로 사용하지 않는다.

동률 처리 규칙을 deterministic하게 작성한다.

---

# 35. 평가 결과 UI

개별 결과:

- 실제 자세
- 예측 자세
- 정답/오답
- 평균 신뢰도
- 유효 샘플 수
- 클래스별 평균 probability
- 모델 버전

누적 요약:

- 총 평가 수
- 전체 정확도
- 클래스별 정확도
- 참여자별 정확도
- 4×4 혼동행렬 표

정확도 denominator가 0이면 0%로 속이지 말고 `—`를 표시한다.

브라우저 UI의 혼동행렬은 기본 표면 충분하다.

고급 precision/recall/F1은 Phase 6 Python에서 계산한다.

---

# 36. 평가 목록과 관리

- 최근 평가 목록
- 단일 삭제
- 전체 삭제
- CSV 다운로드
- 모델 버전 필터
- 참여자 필터

삭제는 확인 Dialog 후 수행한다.

평가 데이터가 없으면 Empty State를 표시한다.

---

# 37. 평가 CSV 컬럼

고정 순서:

```text
schema_version
evaluation_id
created_at_iso
participant_code
actual_label
predicted_label
correct
average_confidence
average_good_probability
average_forward_probability
average_side_probability
average_resting_probability
valid_sample_count
rejected_sample_count
collection_duration_ms
model_version
mirror_camera
lighting_condition
camera_distance
environment_note
```

파일명:

```text
studylog-model-evaluation-{localDateKey}.csv
```

전체 저장된 평가 records를 내보낸다.

---

# 38. 기록 삭제 기능

설정 페이지 또는 기록 페이지에 다음 기능을 연결한다.

```text
모든 학습 기록 삭제
모든 평가 기록 삭제
```

각각 별도 확인 Dialog를 사용한다.

버튼은 destructive variant를 사용한다.

삭제 후 UI cache를 즉시 invalidate한다.

캘리브레이션·일반 설정은 학습 기록 삭제 시 자동 삭제하지 않는다.

`모든 로컬 데이터 삭제`를 별도로 제공한다면 대상 데이터를 명확히 표시한다.

---

# 39. 개인정보 안내

기록 페이지와 설정 페이지에 다음 취지의 설명을 제공한다.

```text
학습 기록과 모델 평가 결과는 이 브라우저의 IndexedDB에만 저장됩니다.
영상·사진·얼굴 이미지와 원본 관절 좌표는 저장되지 않습니다.
브라우저 데이터를 삭제하면 기록도 함께 삭제될 수 있습니다.
```

클라우드 백업이 있는 것처럼 표현하지 않는다.

---

# 40. UI 상태

모든 데이터 페이지는 아래 상태를 구분한다.

```text
IDLE
LOADING
READY
EMPTY
ERROR
```

저장 작업:

```text
IDLE
SAVING
SAVED
ERROR
```

사용자가 여러 번 버튼을 눌러 중복 저장하지 않게 한다.

Skeleton과 Empty State는 shadcn/ui 스타일을 유지한다.

---

# 41. 모바일 UX

- 기록 카드 가로 overflow 금지
- 차트는 ResponsiveContainer 사용
- 긴 CSV 버튼은 모바일에서 세로 배치
- 평가 폼은 모바일 1열
- 혼동행렬은 필요 시 가로 스크롤 가능한 명확한 table wrapper
- sticky 또는 fixed UI가 하단 내비게이션을 가리지 않음
- 360px 폭 검증

---

# 42. 성능과 저장 용량

1초당 1개 sample을 기준으로 한다.

```text
1시간 세션 ≈ 3,600 samples
```

원본 영상이 없으므로 일반적인 브라우저 저장 범위 내에서 충분히 작아야 한다.

하지만 다음을 지킨다.

- 원본 랜드마크 금지
- 중복 probability 객체 최소화
- 불필요한 UI derived field 저장 금지
- report 조회 시 필요한 session samples만 로드
- records page에서는 summary만 로드
- 모든 session samples를 한 번에 전역 store에 올리지 않음

대용량 세션 report는 loading state를 제공한다.

---

# 43. 동시성

IndexedDB write가 겹치지 않도록 SessionRecorder 내부에 직렬 queue를 둔다.

예시 원칙:

```text
write1 완료
→ write2 실행
→ write3 실행
```

마지막 write 실패가 이후 모든 write를 영구적으로 막지 않게 한다.

finish는 pending writes가 끝난 뒤 summary를 확정한다.

React StrictMode 때문에 recorder가 두 번 생성되거나 sample interval이 중복되지 않게 한다.

---

# 44. 데이터 캐시와 갱신

React Query를 새로 도입하지 않는다.

현재 규모에서는 custom hook과 local state 또는 Zustand를 사용한다.

Repository 변경 후:

- records page reload/invalidate
- report page reload
- evaluation list reload

구조를 명확히 한다.

---

# 45. 오류 처리

다음 오류를 구분한다.

- IndexedDB 지원 안 됨
- DB open 실패
- quota 초과
- 데이터 검증 실패
- session not found
- CSV 생성 실패
- 파일 다운로드 실패
- 평가 valid sample 부족
- 카메라/TM 준비 안 됨

사용자 문구는 한국어로 제공한다.

예:

```text
기록 저장 공간을 사용할 수 없습니다.
현재 타이머는 계속 동작하지만 세션이 저장되지 않을 수 있습니다.
```

```text
유효한 자세 예측이 충분하지 않습니다.
카메라에 상반신이 보이도록 한 뒤 다시 시도해 주세요.
```

---

# 46. 테스트 환경

`fake-indexeddb`를 사용해 실제 브라우저 DB 없이 repository를 테스트한다.

테스트 사이 DB를 완전히 초기화한다.

테스트가 순서에 의존하지 않게 한다.

---

# 47. 필수 단위 테스트

## DB schema

1. DB version 1 생성
2. 세 object store 생성
3. 필수 index 생성
4. 두 번 open해도 중복 생성 오류 없음

## SessionRepository

1. summary create/get/update
2. samples sequence 순서 조회
3. 특정 session 삭제 시 samples 함께 삭제
4. ACTIVE session 조회
5. clear all
6. validation error

## EvaluationRepository

1. add/list
2. createdAt 정렬
3. delete
4. clear

## SessionSummaryBuilder

1. 비율 계산
2. seated 0일 때 null ratio
3. average/min/max Lux
4. dominant bad reason
5. session kind AI/MOCK/MIXED
6. goal 100% 초과 저장

## CsvExporter

1. comma escape
2. quote escape
3. newline escape
4. null 빈 문자열
5. boolean
6. BOM 포함
7. 고정 column order
8. 한국어 보존

## EvaluationRunner

1. 3초 수집 결과 평균
2. 중복 timestamp 제외
3. stale prediction 제외
4. 최소 sample 부족 실패
5. 최종 argmax
6. 정답 계산

## SessionAnalytics

1. 일간 집계
2. 월요일 시작 주간 집계
3. 과목별 집계
4. MOCK 기본 제외
5. local date midnight 경계

## SessionRecorder

1. 새 세션 생성
2. 1초 sequence 증가
3. PAUSED에서 sample 미생성
4. mode 변경 시 MIXED
5. finish 중복 방지
6. pending writes flush
7. 저장 실패 후 메모리 타이머 유지

---

# 48. 기존 테스트 회귀

기존 Phase 1~4 테스트가 모두 계속 통과해야 한다.

특히:

- PostureFusionEngine
- PostureStateMachine
- LuxStateMachine
- AlertManager
- StudyRuntimeController
- SessionTimer
- CameraManager
- MediaPipe
- TM Pose

Phase 5 때문에 런타임 동작이 바뀌면 안 된다.

---

# 49. 수동 검증 시나리오

## AI 세션

```text
1. /app 접속
2. 카메라 켜기
3. 캘리브레이션
4. AI 모드 세션 시작
5. GOOD 상태 유지
6. BAD 상태 만들기
7. Lux 200으로 변경
8. AWAY 상태 만들기
9. 세션 종료
10. report 이동
11. 차트·수치 확인
12. 상세/요약 CSV 다운로드
13. records 페이지에 세션 표시 확인
```

## Mock 세션

```text
1. /app?demo=1
2. Mock 세션 실행
3. 종료
4. records 기본 필터에서 제외 확인
5. 데모 기록 포함 ON 시 표시 확인
```

## 평가

```text
1. /evaluate
2. P01 선택
3. GOOD_POSTURE 선택
4. 3초 countdown + 3초 수집
5. 결과 저장
6. 네 클래스 반복
7. 평가 목록·정확도·혼동행렬 확인
8. CSV 다운로드
```

## 복구

```text
1. 세션 시작
2. 5초 이상 진행
3. 페이지 새로고침
4. ACTIVE 세션 복구 Dialog
5. INTERRUPTED로 저장
6. records/report 확인
```

---

# 50. Vercel Preview 검증

Preview에서 반드시 확인한다.

- `/app`
- `/app/records`
- `/evaluate`
- `/report/:sessionId`

검증:

```text
[ ] IndexedDB 저장
[ ] 새로고침 후 기록 유지
[ ] 직접 report URL 새로고침 404 없음
[ ] CSV 다운로드
[ ] 모바일 기록 화면
[ ] 카메라와 AI 기존 동작
[ ] 원본 영상 네트워크 업로드 없음
[ ] 외부 API 요청 없음
```

Vercel Preview URL을 완료 보고에 포함한다.

---

# 51. README 갱신

다음 내용을 추가한다.

1. Phase 5 기능
2. IndexedDB 로컬 저장 안내
3. 저장되는 데이터와 저장되지 않는 데이터
4. 세션 CSV schema 설명
5. 평가 CSV schema 설명
6. 기록 삭제 방법
7. 비정상 종료 복구
8. Mock 기록이 기본 통계에서 제외되는 이유
9. Phase 6 Python 분석 예정
10. 브라우저 데이터 삭제 시 기록이 사라질 수 있음

---

# 52. 완료 기준

아래를 모두 충족해야 Phase 5 완료다.

1. Phase 4가 main에 병합됨
2. 새 Phase 5 브랜치에서 작업
3. IndexedDB DB version 1 생성
4. sessions store 생성
5. sessionSamples store 생성
6. evaluationRecords store 생성
7. 세션 시작 시 ACTIVE summary 저장
8. RUNNING 중 1초 단위 sample 저장
9. PAUSED 중 sample 미생성
10. 종료 시 COMPLETED summary 저장
11. 종료 후 report 이동
12. ACTIVE 세션 복구 UX
13. records page 실제 데이터 표시
14. AI 기록 기본 표시
15. Mock 기록 기본 제외
16. 일간·주간·과목별 집계
17. report summary 표시
18. 자세·Lux 차트 표시
19. 상세 CSV 다운로드
20. 요약 CSV 다운로드
21. 평가 3초 수집
22. 평균 probability 기반 예측
23. 평가 IndexedDB 저장
24. 평가 정확도 표시
25. 혼동행렬 표 표시
26. 평가 CSV 다운로드
27. 단일·전체 삭제
28. 영상·사진·landmarks 미저장
29. 기존 AI runtime 회귀 없음
30. 기존 모든 테스트 통과
31. 신규 테스트 통과
32. lint 경고 0
33. typecheck 통과
34. production build 성공
35. Vercel Preview 검증
36. README 갱신

---

# 53. 완료 보고 형식

Phase 5 구현 후 아래 형식으로 보고한다.

## Git/PR 상태

## 구현 기능

## 생성·변경 파일

## 설치 패키지와 정확한 버전

## IndexedDB 스키마

## 세션 기록 생명주기

## CSV 스키마와 예시 파일명

## 평가 방식

## 기록·리포트 화면

## 개인정보 보호 확인

## 테스트 결과

```text
npm run lint
npm run typecheck
npm run test
npm run build
```

## 수동 브라우저 검증 결과

## Vercel Preview URL

## 알려진 제한

## Phase 6 전에 확인할 사항

Phase 6 Python 분석은 임의로 시작하지 말고 완료 보고 후 중단한다.


