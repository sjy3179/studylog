+Exit code: 0
Wall time: 0.5 seconds
Output:
# studylog 최종 완성·통합 검증 지시서

## 0. 현재 상태

`studylog`는 현재 다음 기능까지 구현되어 있다.

- React + TypeScript + Vite 기반 웹 앱
- shadcn/ui 기반 반응형 UI
- 랜딩 페이지와 앱 라우트
- MediaPipe Pose Landmarker 기반 관절 인식
- Teachable Machine Pose 기반 자세 분류
- 최종 자세 모델 파일 적용
- MediaPipe와 Teachable Machine 결과 융합
- 자세 상태 안정화
- 가상 조도 센서와 Lux 경고
- 순공 시간 및 상세 시간 기록
- IndexedDB 기반 세션·평가 데이터 저장
- 세션 리포트와 CSV 내보내기
- `/evaluate` 모델 평가 기능
- Python 객체지향 데이터 분석 프로그램

최종 Teachable Machine Pose 모델과 클래스명 정리는 이미 완료된 상태다.

따라서 이번 작업에서는 모델 파일을 다시 교체하거나 클래스명을 다시 수정하지 않는다.

이번 작업의 목적은 현재 구현된 기능을 하나의 완성된 서비스로 통합 검증하고, 남아 있는 오류·누락·불일치를 수정한 뒤, 프로덕션 배포본을 최종 상태로 만드는 것이다.

새로운 대규모 기능을 추가하거나 전체 구조를 다시 작성하지 않는다.

---

# 1. 작업 원칙

1. 이미 정상 동작하는 기능을 유지한다.
2. 기존 클래스를 중복 구현하지 않는다.
3. 대규모 리팩터링보다 실제 동작 안정성을 우선한다.
4. 현재 적용된 Teachable Machine Pose 모델을 그대로 사용한다.
5. 모델 재학습이나 추가 데이터 수집은 하지 않는다.
6. 로그인, 회원가입, 별도 백엔드, API 서버를 추가하지 않는다.
7. Supabase, Firebase, WebSocket을 추가하지 않는다.
8. 실제 그룹 생성·초대·입장 기능을 구현하지 않는다.
9. 그룹 페이지는 현재처럼 더미 데이터와 disabled 버튼만 유지한다.
10. 원본 영상, 이미지, 음성, 원본 관절 배열을 저장하지 않는다.
11. 실제 측정하지 않은 정확도나 성능 수치를 만들지 않는다.
12. 합성 fixture 결과를 실제 모델 성능으로 표현하지 않는다.
13. 현재 동작하는 TensorFlow.js·Teachable Machine 관련 패키지를 무리하게 업그레이드하지 않는다.
14. `npm audit fix --force`를 실행하지 않는다.
15. 디자인을 전면 교체하지 않는다.
16. 계획만 작성하고 멈추지 말고, 안전하게 진행 가능한 작업은 수정·검증·배포까지 완료한다.

---

# 2. 작업 시작 전 코드 감사

먼저 현재 저장소를 확인해 아래 기능의 실제 구현 위치와 연결 상태를 파악한다.

## 프론트엔드 구조

- `src/ai/`
- `src/runtime/`
- `src/state/`
- `src/session/`
- `src/data/`
- `src/pages/`
- `src/components/`
- `src/stores/`
- `public/models/tm-pose/`
- `public/models/mediapipe/`
- `public/mediapipe/wasm/`

## Python 구조

- `python/studylog_analysis/`
- `python/tests/`
- `python/README.md`
- Python 의존성 파일

## 기존 핵심 책임

실제 클래스명이 다르더라도 아래 책임을 가진 구현을 찾고 재사용한다.

- CameraManager
- MediaPipePoseEngine
- TeachableMachinePoseClassifier
- CalibrationManager
- PostureDeviationAnalyzer
- PostureFusionEngine
- PostureStateMachine
- LuxStateMachine
- StudyRuntimeController
- SessionTimer
- SessionRecorder
- SessionRepository
- EvaluationRepository
- CsvExporter
- Python SessionDataLoader
- Python SessionAnalyzer
- Python LuxAnalyzer
- Python ModelEvaluator
- Python ChartGenerator
- Python ReportGenerator
- Python CLI/App

감사 후 다음을 짧게 정리하고 바로 작업을 진행한다.

1. 이미 완성된 기능
2. 연결이 누락된 기능
3. 현재 오류 또는 회귀 가능성이 있는 부분
4. 수정할 핵심 파일
5. 최종 검증 계획

---

# 3. 최종 모델 적용 상태 확인

최종 모델은 이미 아래 경로에 적용된 상태라고 가정한다.

```text
public/models/tm-pose/
├─ model.json
├─ metadata.json
├─ weights.bin
└─ posenet/
```

이번 작업에서는 세 파일을 다시 교체하지 않는다.

다만 다음 항목은 확인한다.

1. `model.json`, `metadata.json`, `weights.bin` 요청이 모두 HTTP 200인지
2. 모델이 정상적으로 READY/RUNNING 상태가 되는지
3. 클래스 네 개가 정상적으로 출력되는지
4. 모델 버전 표시가 최종 버전인지
5. 사용자 UI에 `파일럿 모델`, `임시 모델` 같은 표현이 남아 있지 않은지
6. README의 모델 설명이 현재 상태와 일치하는지
7. 이전 모델 캐시 때문에 다른 결과가 나오지 않는지

표준 자세 클래스:

```text
GOOD_POSTURE
FORWARD_LEAN
SIDE_LEAN
RESTING
```

앱 내부 상태, UI, IndexedDB, CSV, 평가 기록, Python 분석에서 위 표준 이름만 사용한다.

---

# 4. 카메라와 AI 런타임 최종 검증

## 4.1 카메라

다음을 보장한다.

- 사용자가 버튼을 눌렀을 때만 권한 요청
- audio 요청 없음
- 하나의 MediaStream만 생성
- MediaPipe와 Teachable Machine이 같은 video element 공유
- 카메라 장치 변경 시 이전 track 종료
- 카메라 OFF 시 모든 video track 종료
- 페이지 이동·컴포넌트 unmount 시 stream 정리
- React StrictMode에서 중복 stream 생성 없음
- 카메라 권한 거부, 장치 없음, 사용 중 오류 UI 정상
- 카메라 없이 Mock 데모 사용 가능

## 4.2 MediaPipe

- Pose Landmarker Lite 정상 로딩
- 로컬 model 및 WASM 사용
- 외부 CDN 의존 없음
- numPoses 1
- 관절 오버레이 정상
- 좌우반전과 관절 좌표 일치
- 사람이 없을 때 이전 관절선이 남지 않음
- 추론 루프 중복 없음
- 페이지 이동 시 dispose
- 오래된 MediaPipe 결과를 계속 사용하지 않음

## 4.3 Teachable Machine Pose

- 기존 단일 video 입력 공유
- 외부 CDN 의존 없음
- 모델 중복 로딩 없음
- 카메라가 정지하면 추론도 정지
- 모델 오류 시 사용자 친화적 오류와 재시도
- Mock fallback 유지
- 클래스별 원시 probability 정상
- 최고 확률 클래스 정상
- 오래된 예측 결과 무기한 재사용 금지

---

# 5. 자세 결과 융합

## MediaPipe 역할

- 사람 존재 여부
- 관절 오버레이
- 기준 자세 캘리브레이션
- 기준 자세와 현재 자세 편차
- 자리 비움 원시 신호

## Teachable Machine 역할

- GOOD_POSTURE
- FORWARD_LEAN
- SIDE_LEAN
- RESTING
- 각 클래스 확률

## 원시 상태

```ts
type RawPostureState =
  | "GOOD"
  | "FORWARD"
  | "SIDE"
  | "RESTING"
  | "NO_POSE"
  | "UNKNOWN";
```

## 안정 상태

```ts
type StablePostureState =
  | "GOOD"
  | "BAD"
  | "AWAY"
  | "UNKNOWN";
```

## 사용자 표시 상태

```ts
type StudyStatus =
  | "STUDYING"
  | "POSTURE_CAUTION"
  | "LUX_CAUTION"
  | "MULTI_CAUTION"
  | "AWAY"
  | "CHECKING"
  | "PAUSED";
```

## 융합 규칙

```text
MediaPipe에서 유효 포즈 없음
→ NO_POSE 후보

TM FORWARD_LEAN
→ BAD 후보

TM SIDE_LEAN
→ BAD 후보

TM RESTING
→ BAD 후보

TM GOOD_POSTURE + MediaPipe 편차 정상
→ GOOD 후보

TM GOOD_POSTURE + MediaPipe 편차 매우 큼
→ BAD 후보

TM 결과 신뢰도 부족
→ UNKNOWN

TM 또는 MediaPipe 결과가 오래됨
→ UNKNOWN 또는 CHECKING
```

MediaPipe가 TM의 BAD 결과를 GOOD으로 올리지 않는다.

---

# 6. AI 결과 freshness

오래된 GOOD 결과로 순공 시간이 계속 증가하면 안 된다.

현재 설정값을 확인하되 최소 아래 수준을 만족한다.

```text
TM prediction freshness: 약 1000ms 이내
MediaPipe result freshness: 약 600ms 이내
```

다음 상황에서는 이전 GOOD 결과를 사용하지 않는다.

- 카메라 꺼짐
- 비디오 프레임 정지
- MediaPipe 중단
- TM 모델 중단
- 페이지 이동
- 브라우저 탭 장시간 hidden
- 모델 재초기화
- 카메라 장치 변경

이 경우 순공 시간은 증가하지 않고 `CHECKING` 또는 `UNKNOWN`으로 처리한다.

---

# 7. 상태 안정화

다음 로직이 실제 런타임에 적용되는지 확인한다.

```text
최근 12회 결과 중 같은 상태가 8회 이상
→ 후보 상태 인정
```

지속시간:

```text
GOOD: 1.5초
BAD: 3초
AWAY: 유효 포즈 미검출 2.5초
UNKNOWN: 최대 2초 동안 이전 표시 상태 보호
```

중요:

- UNKNOWN 보호 중 순공 시간 증가 금지
- 한두 번의 오분류로 상태가 깜빡이지 않음
- 자리에서 돌아온 직후 바로 순공 증가 금지
- GOOD 안정화 과정을 다시 거침
- AI 모드와 Mock 모드가 동시에 타이머를 제어하지 않음

---

# 8. 캘리브레이션

기준 자세 등록 흐름을 최종 확인한다.

```text
카메라·MediaPipe 준비
→ 3초 카운트다운
→ 2.5초간 유효 sample 수집
→ 중앙값 기반 baseline 계산
→ CalibrationProfile 저장
```

다음을 보장한다.

- 필수 landmark가 부족하면 실패 안내
- sample 수가 부족하면 다시 시도
- 카메라 장치 또는 mirror 변경 시 재등록 안내
- 영상이나 사진은 저장하지 않음
- 자세 비교용 수치만 로컬 저장
- 의료적 진단 표현 없음

---

# 9. Lux 시뮬레이션

실제 하드웨어를 추가하지 않는다.

```ts
interface LuxProvider {
  getLux(): number;
}
```

기본 상태:

```text
0~299: DARK
300~499: DIM
500~700: RECOMMENDED
701~1000: BRIGHT
1001 이상: TOO_BRIGHT
```

심사위원용 패널:

- 0~1500 Lux slider
- 200 Lux preset
- 620 Lux preset
- 1200 Lux preset

Lux 상태는 3초 안정화와 hysteresis를 사용한다.

화면 숫자는 즉시 반영해도 되지만, 타이머와 경고에는 안정화된 Lux 상태를 사용한다.

조도 경고:

- DARK 또는 TOO_BRIGHT 확정 시 Alert
- 설정이 ON이면 경고음
- 같은 Lux 경고 60초 쿨다운
- 페이지 전체를 읽기 어렵게 만들지 않음

---

# 10. 순공 타이머

기존 SessionTimer의 누적값을 사용한다.

```ts
interface SessionDurations {
  totalSessionMs: number;
  effectiveStudyMs: number;
  seatedMs: number;
  postureCautionMs: number;
  awayMs: number;
  luxCautionMs: number;
  checkingMs: number;
}
```

## 정의

### totalSessionMs

세션 RUNNING 전체 시간.

### effectiveStudyMs

기본 설정:

```text
세션 RUNNING
+ 안정 자세 GOOD
+ 안정 Lux RECOMMENDED
```

Lux 반영 설정이 OFF라면:

```text
세션 RUNNING
+ 안정 자세 GOOD
```

### postureCautionMs

사람이 존재하고 안정 자세 BAD인 시간.

### awayMs

안정 자세 AWAY인 시간.

### luxCautionMs

사람이 존재하고 Lux가 RECOMMENDED가 아닌 시간.

### checkingMs

AI가 fresh하지 않거나 판단 중인 시간.

주의:

- postureCautionMs와 luxCautionMs는 동시에 증가할 수 있음
- 세부 시간을 더해 totalSessionMs와 같다고 가정하지 않음
- 중복 tick 또는 두 개의 timer loop 금지

기본 화면에는 순공 시간만 크게 표시한다.

전체·자세 주의·자리 비움·조도 주의 시간은 설정에서 활성화한 경우에만 표시한다.

---

# 11. 경고

## 자세

```text
BAD 15초 지속
→ 자세 경고 1회

동일 경고 재출력
→ 120초 쿨다운
```

## 조도

```text
DARK 또는 TOO_BRIGHT 확정
→ 조도 경고

동일 경고 재출력
→ 60초 쿨다운
```

경고 수단:

- shadcn Alert
- Sonner toast
- 선택적 짧은 경고음

경고 반복으로 사용자를 방해하지 않는다.

---

# 12. 세션 기록·IndexedDB

IndexedDB stores:

```text
sessions
sessionSamples
evaluationRecords
```

## 세션 생명주기

```text
IDLE
→ ACTIVE 생성
→ RUNNING 중 1초 sample
→ PAUSED 중 sample 중단
→ RUNNING 재개
→ COMPLETED summary
→ report 이동
```

## 비정상 종료

ACTIVE 세션이 남아 있으면 다음 접속에서 복구 또는 정리 Dialog를 제공한다.

## 저장 가능

- 자세 표준 라벨
- 확률
- MediaPipe 감지 여부
- 자세 편차 점수·사유
- Lux
- 안정 자세
- 사용자 상태
- 누적 시간
- 과목
- 세션 종류

## 저장 금지

- 영상
- 사진
- 얼굴 이미지
- 음성
- canvas 이미지
- 원본 MediaPipe landmark 배열

---

# 13. 기록 페이지

`/app/records`에서 실제 IndexedDB 데이터를 표시한다.

필수:

- 일간
- 주간
- 과목별
- 최근 세션
- 순공 시간
- 목표 달성률
- 기준 자세 유지율
- 적정 조도 유지율
- Empty State

AI 세션을 기본 집계한다.

Mock/MIXED는 `데모 기록 포함` 설정이 켜진 경우만 표시한다.

자리 비움 등의 상세 시간은 기본적으로 숨기거나 접힌 영역에 둔다.

---

# 14. 세션 리포트

`/report/:sessionId`

필수:

- 순공 시간
- 전체 세션
- 기준 자세 유지율
- 적정 조도 유지율
- 상태 타임라인
- Lux 변화 그래프
- 자세 분포
- 세부 시간
- 상세 CSV 다운로드
- 요약 CSV 다운로드

직접 URL 접근과 새로고침이 정상이어야 한다.

없는 sessionId에서는 앱 전체 오류 대신 Not Found 또는 기록 없음 UI를 보여준다.

---

# 15. CSV

다음을 유지한다.

- UTF-8 BOM
- RFC 4180 escaping
- ISO timestamp
- 고정 컬럼 순서
- raw number
- 표준 자세 라벨

지원:

- 세션 상세 CSV
- 세션 요약 CSV
- 모델 평가 CSV

CSV를 Excel과 메모장에서 열었을 때 한글이 깨지지 않아야 한다.

---

# 16. 모델 평가 페이지

라우트:

```text
/evaluate
```

흐름:

```text
참여자 코드 입력
→ 실제 자세 라벨 선택
→ 3초 카운트다운
→ 3초간 fresh TM 예측 수집
→ 클래스별 평균 probability 계산
→ 최고 평균 클래스 선택
→ 정답 여부 기록
→ IndexedDB 저장
```

실제 라벨:

```text
GOOD_POSTURE
FORWARD_LEAN
SIDE_LEAN
RESTING
```

표시:

- 실제 라벨
- 예측 라벨
- 평균 신뢰도
- 정답 여부
- 모델 버전
- 총 표본 수
- 정확도
- 고정 4×4 혼동행렬
- 평가 CSV 다운로드

표본이 적을 때:

```text
현재 평가 표본 수가 적어 모델 전체 성능을 대표하지 않을 수 있습니다.
```

라는 안내를 표시한다.

---

# 17. Python 객체지향 분석 프로그램

현재 구현된 Phase 6 코드를 검증하고, 누락된 경우에만 보완한다.

## 구조

```text
python/
├─ studylog_analysis/
├─ tests/
└─ README.md
```

## 실제 사용되는 클래스

최소 다음 책임이 실제 실행 흐름에 포함되어야 한다.

- SessionDataLoader
- EvaluationDataLoader
- DataPreprocessor
- SessionAnalyzer
- LuxAnalyzer
- ModelEvaluator
- ChartGenerator
- ReportGenerator
- StudylogAnalysisApp 또는 StudyLogCLI

클래스 선언만 존재하고 사용되지 않는 상태는 허용하지 않는다.

최상위 App 또는 CLI가 객체를 생성하고 다음 순서로 실행한다.

```text
CSV 로딩
→ 스키마 검증
→ 전처리
→ 세션 분석
→ Lux 분석
→ 모델 평가
→ 차트 생성
→ TXT/JSON/CSV 리포트 생성
```

## 누적 duration 처리

아래 누적 컬럼을 행별 합산하지 않는다.

- total_session_ms
- effective_study_ms
- seated_ms
- posture_caution_ms
- away_ms
- lux_caution_ms
- checking_ms

우선순위:

1. summary CSV
2. 마지막 유효 sample
3. 누적 컬럼 max

## 모델 평가

고정 클래스 순서:

```python
LABELS = [
    "GOOD_POSTURE",
    "FORWARD_LEAN",
    "SIDE_LEAN",
    "RESTING",
]
```

가능한 데이터가 있을 때 계산:

- accuracy
- precision
- recall
- F1
- macro average
- weighted average
- 4×4 confusion matrix
- participant별 정확도
- lighting별 정확도
- camera distance별 정확도
- confidence 구간별 정확도
- 오분류 쌍

데이터가 부족하면 없는 결과를 만들지 않고 경고를 출력한다.

## 세션·Lux 분석

- 전체 세션
- 순공 시간
- 착석 시간
- 자세 주의
- 자리 비움
- 조도 주의
- checking
- 순공 비율
- 기준 자세 유지율
- 적정 조도 유지율
- Lux 평균·중앙값·최소·최대
- Lux 상태별 비율
- 과목별 분석

## 출력

```text
summary.txt
summary.json
data_quality.json
분석 CSV
matplotlib PNG
```

합성 fixture 결과는 실제 성능으로 표현하지 않는다.

---

# 18. Python 검증

`python/`에서 실행한다.

```bash
python -m ruff check .
python -m pytest
python -m compileall studylog_analysis
```

실제 세션·평가 CSV가 저장소에 있다면 CLI를 실제 데이터로 한 번 실행한다.

실제 CSV가 없다면:

- fixture 기반 종단 실행
- 프로그램 정상 동작 확인
- 실제 성능 수치 생성 금지
- 완료 보고에 실제 평가 데이터가 아직 없다고 명시

---

# 19. UI 최종 점검

현재 shadcn/ui 디자인을 유지한다.

## PC

- 사이드바
- 중앙 타이머·카메라
- 오른쪽 상태·Lux

## 모바일

- 하단 고정 내비게이션
- 대형 순공 타이머
- 접을 수 있는 카메라 카드
- safe area
- 44px 이상 터치 영역
- 360px 가로 overflow 없음

## 그룹

- 더미 멤버
- 더미 랭킹
- UI 데모 Badge
- 생성·초대·참가 버튼 disabled
- 네트워크 요청 없음

---

# 20. 개인정보·표현

표시할 취지:

```text
카메라 영상은 현재 브라우저 안에서 실시간 분석에만 사용되며
원본 영상과 이미지는 저장되거나 서버로 전송되지 않습니다.
```

사용 금지:

- 집중력을 정확하게 측정
- 거북목 진단
- 척추 상태 진단
- 시력 저하 예방 보장
- 모든 자세를 정확히 인식

권장:

- 화면에서 관찰 가능한 자세 분류
- 사용자가 등록한 기준 자세와 비교
- 설정된 조도 범위를 벗어나면 안내
- 환경과 카메라 각도에 따라 오분류 가능

---

# 21. 자동 테스트

프로젝트 루트:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

기존 테스트를 삭제하거나 skip하지 않는다.

필수 검증 영역:

- CameraManager
- MediaPipe lifecycle
- TM model loading
- PostureFusionEngine
- PostureStateMachine
- LuxStateMachine
- SessionTimer
- SessionRecorder
- IndexedDB repositories
- CSV export
- Evaluation aggregation
- route rendering
- mobile overflow 관련 테스트가 있다면 유지

Python:

```bash
cd python
python -m ruff check .
python -m pytest
python -m compileall studylog_analysis
```

---

# 22. 프로덕션 배포와 실제 검증

대상 URL:

```text
https://studylog-steel.vercel.app/
```

최종 빌드 후 production에 반영하고 아래를 직접 확인한다.

## 라우트

- `/`
- `/app`
- `/app/records`
- `/app/groups`
- `/app/settings`
- `/evaluate`
- 실제 `/report/:sessionId`

## Network

- TM model.json 200
- TM metadata.json 200
- TM weights.bin 200
- local PoseNet files 200
- MediaPipe task model 200
- MediaPipe WASM 200
- 치명적인 404 없음

## 기능

1. 랜딩 CTA
2. 카메라 권한
3. 카메라 영상
4. 관절 오버레이
5. 기준 자세 등록
6. 네 자세 probability 반응
7. GOOD 안정화 후 순공 증가
8. FORWARD_LEAN 후 순공 정지
9. SIDE_LEAN 후 순공 정지
10. RESTING 후 순공 정지
11. 자리 비움 후 순공 정지
12. 복귀 후 재안정화
13. 200 Lux 경고
14. 620 Lux 정상
15. 1200 Lux 경고
16. 세션 종료
17. 리포트
18. 기록 유지
19. 상세·요약 CSV
20. `/evaluate`
21. 평가 저장
22. 혼동행렬
23. 평가 CSV
24. 모바일 360px
25. 그룹 버튼 disabled
26. 콘솔 치명적 오류 없음

실제 웹캠이 없는 실행 환경이라 자동으로 검증할 수 없는 항목은 명확히 구분하고, 나머지는 브라우저 자동화 또는 수동 확인 가능한 범위까지 검증한다.

---

# 23. 우선순위

## P0

- 배포 사이트 로딩 실패
- 라우트 404
- 모델·WASM 404
- 카메라 사용 불가
- AI 무한 로딩
- 타이머 중복 증가
- 기록 유실
- IndexedDB 오류로 앱 중단
- CSV 불가
- evaluate 불가
- build 실패

## P1

- 관절 오버레이 불일치
- 상태 깜빡임
- stale GOOD
- AWAY 오류
- Lux 반복 경고
- 세션 복구 오류
- Python CSV 호환 오류
- 모바일 overflow

## P2

- 문구 정리
- 차트 간격
- 비핵심 애니메이션
- 스타일 미세 조정

P0와 P1을 우선 해결한다.

---

# 24. 구현하지 않을 것

- 모델 파일 재교체
- 모델 재학습
- 추가 데이터 수집
- 로그인
- 실제 그룹
- API 서버
- Supabase
- Firebase
- WebSocket
- 새로운 AI 모델
- 대규모 PWA 작업
- 디자인 전면 재작업
- 가짜 평가 수치
- 영상·사진 저장

---

# 25. 완료 기준

1. 현재 최종 모델이 정상 로딩됨
2. 네 자세 분류가 앱에서 작동함
3. MediaPipe와 TM이 단일 카메라를 공유함
4. 캘리브레이션 정상
5. 결과 freshness 정상
6. 상태 안정화 정상
7. 순공 타이머 정상
8. 자리 비움 처리 정상
9. Lux 상태·경고 정상
10. IndexedDB 기록 정상
11. 세션 리포트 정상
12. 기록 페이지 정상
13. CSV 세 종류 정상
14. evaluate 정상
15. Python 프로그램 정상
16. 프론트엔드 검증 통과
17. Python 검증 통과
18. Vercel production build 성공
19. 프로덕션 핵심 흐름 확인
20. 남은 제한 사항이 명확히 기록됨

---

# 26. 최종 보고 형식

## 현재 구조 확인 결과

## 수정한 문제

## 변경한 주요 파일

## AI 런타임 검증

- Camera
- MediaPipe
- TM Pose
- Calibration
- Fusion
- Stabilization
- Timer
- Lux

## 데이터 기능 검증

- IndexedDB
- Session
- Report
- Records
- CSV
- Evaluation

## Python 검증

- 사용 클래스
- 테스트
- 생성 결과
- 실제 데이터 여부

## 자동 검증

```text
npm run lint
npm run typecheck
npm run test
npm run build
python -m ruff check .
python -m pytest
python -m compileall studylog_analysis
```

## 프로덕션 검증

- 최종 URL
- 정상 라우트
- 모델 자산
- 실제 확인 기능
- 콘솔 오류

## 알려진 제한

단순 계획 보고로 종료하지 말고, 안전하게 진행할 수 있는 수정·테스트·배포·검증까지 완료한 뒤 보고한다.


