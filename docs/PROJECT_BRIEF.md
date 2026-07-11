# studylog 개발 마스터 지시서

## 0. 역할과 작업 원칙

너는 `studylog` 프로젝트를 구현하는 시니어 프론트엔드·AI 웹 개발자다.

이 문서를 프로젝트의 `docs/PROJECT_BRIEF.md`로 저장하고, 프로젝트 루트에는 핵심 반복 규칙만 담은 `AGENTS.md`를 별도로 만든다.

작업을 시작하기 전에 반드시 다음 순서를 지킨다.

1. 현재 저장소와 첨부된 모델 파일을 확인한다.
2. 구현 대상 Phase와 완료 조건을 먼저 정리한다.
3. 사용할 패키지의 버전 호환성을 확인한다.
4. 변경 예정 파일 목록을 제시한다.
5. 코드를 작성한다.
6. 각 Phase가 끝나면 lint, test, build를 실행한다.
7. 구현한 기능, 변경 파일, 실행 명령, 검증 결과, 남은 TODO를 보고한다.
8. 사용자가 요청하지 않은 다음 Phase를 임의로 시작하지 않는다.

핵심 원칙:

- 패키지 매니저는 `npm`으로 통일한다.
- TypeScript `strict` 모드를 유지한다.
- 백엔드, 로그인, 인증, 데이터베이스, WebSocket을 구현하지 않는다.
- 그룹 기능은 정적 더미 UI만 구현한다.
- 웹캠 원본 영상과 이미지 프레임을 저장하거나 서버로 전송하지 않는다.
- 하나의 `MediaStream`과 하나의 `<video>` 요소만 생성하고 모든 비전 엔진이 공유한다.
- 의료 진단, 시력 보호 보장, 실제 집중력 측정이라고 표현하지 않는다.
- 새로운 기능을 임의로 추가하지 말고 이 문서를 우선한다.
- AI 모델이나 카메라가 없어도 Mock 모드로 UI를 확인할 수 있어야 한다.
- 각 모듈의 책임을 분리하고, 화면 컴포넌트 안에 AI·타이머·저장 로직을 직접 몰아넣지 않는다.

---

## 1. 프로젝트 개요

프로젝트명은 항상 소문자 `studylog`로 표기한다.

`studylog`는 웹캠 기반 AI 자세 분류, MediaPipe 기준 자세 분석, 가상 조도 센서값을 결합하여 사용자의 학습 세션을 기록하는 개인용 캠스터디 웹 앱이다.

사용자의 실제 생각이나 이해도, 학업 능력, 집중력을 판정하지 않는다.

프로젝트 안에서 사용하는 `순공 시간`은 다음 조건을 모두 충족한 시간으로 정의한다.

1. 세션이 수동으로 실행 중이다.
2. 사용자가 웹캠에서 감지된다.
3. 안정화된 자세 상태가 `GOOD`이다.
4. 조도 조건 반영 설정이 켜져 있다면 조도 상태가 `RECOMMENDED`이다.

앱 안에 다음 취지의 안내를 Tooltip 또는 정보 카드로 표시한다.

> studylog의 순공 시간은 실제 집중력을 측정한 값이 아니라, 착석·자세·조도 조건을 충족한 시간입니다.

---

## 2. 현재 제공되는 AI 모델

사용자가 제공하는 모델은 **Teachable Machine Pose Project**에서 학습하고 TensorFlow.js 형식으로 내보낸 모델이다. Image Project 모델로 취급하지 않는다.

모델 파일:

```text
public/models/tm-pose/
├─ model.json
├─ metadata.json
└─ weights.bin
```

실제 압축 파일의 `.bin` 파일명이 다르다면 이름을 임의로 변경하지 말고 `model.json`의 weights manifest가 참조하는 이름을 그대로 유지한다.

정확한 클래스명:

```text
GOOD_POSTURE
FORWARD_LEAN
SIDE_LEAN
RESTING
```

앱 초기화 시 `metadata.json`의 클래스 목록을 검증하고, 클래스가 누락되거나 이름이 다르면 개발자 콘솔과 사용자 오류 카드에 명확한 메시지를 표시한다.

`AWAY` 또는 `NO_PERSON` 클래스는 Teachable Machine 모델에 존재하지 않는다. 자리 비움은 MediaPipe의 사람 미검출 지속시간으로 판정한다.

모델 파일이 아직 없거나 로딩이 실패한 경우에는 앱 전체를 중단하지 말고 `MockPostureClassifier`를 사용할 수 있어야 한다.

---

## 3. MVP 범위

반드시 구현할 기능:

1. 서비스 소개 랜딩 페이지
2. 반응형 앱 셸
3. 개인용 순공 타이머
4. 웹캠 권한 요청과 카메라 선택
5. Teachable Machine Pose 자세 분류
6. MediaPipe Pose Landmarker 관절 오버레이
7. MediaPipe 기반 사용자 기준 자세 캘리브레이션
8. Teachable Machine과 MediaPipe 결과 융합
9. 자세 상태 안정화
10. 자리 비움 감지
11. 가상 조도 센서
12. 자세·조도 경고
13. 세션 로그 기록
14. 세션 리포트
15. CSV 내보내기
16. 모델 평가 페이지
17. Python 객체지향 데이터 분석 CLI
18. Vercel 정적 배포
19. 모바일 앱처럼 보이는 반응형 UI
20. PWA 설치 가능 구조
21. 정적 그룹 UI

구현하지 않을 기능:

- 회원가입
- 로그인
- OAuth
- Supabase
- Firebase
- 서버 데이터베이스
- API 서버
- WebSocket
- 실제 그룹 생성
- 실제 그룹 참가
- 실제 초대 코드 생성
- 실제 초대 링크 복사
- 친구 추가
- 실시간 랭킹 동기화
- 다른 사용자의 캠 영상
- 얼굴 인식 또는 신원 확인
- 영상·이미지 업로드
- 음성 녹음
- 의료적 자세 진단

---

## 4. 과제 네 개와 하나의 프로젝트 연결

### Python 기초

웹 앱에서 내보낸 세션 CSV와 모델 평가 CSV를 처리하는 클래스 기반 Python CLI 프로그램을 만든다.

### 데이터사이언스

다음 과정을 하나의 흐름으로 수행한다.

- 데이터 정의
- 자세 예측, 조도, 타이머 로그 수집
- 결측값과 잘못된 값 가공
- 모델 정확도와 혼동행렬 분석
- 자세 상태별 시간 분석
- 조도 상태 분석
- 분석 결과를 신뢰도 임계값과 상태 안정화 조건 개선에 반영

### 인공지능

- 자세 분류 문제 정의
- Teachable Machine Pose용 데이터 직접 수집
- 모델 학습
- 별도 평가 데이터 수집
- 정확도와 혼동행렬 평가
- TensorFlow.js 모델을 웹 앱에 배포

### 피지컬 AI

입력:

- 노트북 웹캠
- Teachable Machine Pose 예측값
- MediaPipe Pose 랜드마크
- 가상 조도 센서값

출력:

- 순공 타이머 제어
- 자세 경고
- 조도 경고
- 자리 비움 처리
- UI 상태 변경
- 세션 데이터 저장

---

## 5. 기술 스택

### 프론트엔드

- React
- TypeScript
- Vite
- React Router
- Zustand
- Zod
- Recharts
- Lucide React
- `idb` 또는 최소한의 IndexedDB wrapper

### 디자인 시스템

- shadcn/ui
- Tailwind CSS
- CSS 변수 기반 디자인 토큰
- 기본 라이트 테마
- 다크모드 확장 가능한 구조만 유지

### AI

- `@mediapipe/tasks-vision`
- `@teachablemachine/pose`
- `@tensorflow/tfjs`

### Teachable Machine Pose 호환성 규칙

Teachable Machine Pose 런타임은 오래된 TensorFlow.js 의존성을 요구할 수 있으므로 다음 순서로 처리한다.

1. 우선 `@teachablemachine/pose@0.8.6`과 호환되는 TensorFlow.js 버전을 정확히 고정한다.
2. 무조건 최신 TensorFlow.js를 설치하지 않는다.
3. `npm install`, `npm run build`로 실제 Vite 번들 호환성을 확인한다.
4. Teachable Machine 관련 코드는 반드시 `TeachableMachinePoseClassifier` 어댑터 안에 격리한다.
5. NPM 번들 방식이 실패하면 프로젝트 전체를 바꾸지 않는다.
6. 대안으로 공식 UMD 번들을 `public/vendor/tm-pose/` 아래에 로컬로 포함하고 `window.tmPose`를 한 번만 로딩하는 방식을 사용한다.
7. 최종 배포본에서 외부 CDN에 의존하지 않는다.
8. 선택한 방식과 버전은 `docs/TECH_DECISIONS.md`에 기록한다.

### 테스트

- Vitest
- React Testing Library
- 핵심 상태 머신과 타이머 단위 테스트

### PWA

- `vite-plugin-pwa`
- manifest
- `display: standalone`

### Python

- pandas
- NumPy
- scikit-learn
- matplotlib
- argparse

### 배포

- GitHub
- Vercel
- 백엔드 없음
- 환경 변수 없이 기본 기능 작동

---

## 6. 라우트

React Router 기반 SPA로 구현한다.

```text
/                         서비스 소개 랜딩 페이지
/app                      오늘의 캠스터디 타이머
/app/records              학습 기록
/app/groups               정적 그룹 UI
/app/settings             설정
/evaluate                 AI 모델 평가 도구
/report/:sessionId        세션 상세 리포트
```

Vercel에서 각 경로로 직접 접근하거나 새로고침해도 404가 발생하지 않아야 한다.

---

## 7. 브랜드 및 디자인

브랜드명:

```text
studylog
```

메인 카피:

```text
공부한 시간보다,
공부한 상태까지 기록하세요.
```

보조 설명:

```text
웹캠 기반 자세 분석과 학습 공간의 밝기 데이터를 이용해
착석 상태, 자세 변화, 권장 조건 학습 시간을 기록합니다.
```

디자인 목표:

- 차분한 생산성 앱
- 공부 중 시각적 방해가 적음
- 신뢰감 있는 AI 도구
- 데스크톱에서는 완성된 웹 서비스
- 모바일에서는 설치형 앱과 유사한 앱 셸
- 기존 열품타의 기능적 정보 구조만 참고
- 기존 서비스의 색상, 문구, 아이콘, 레이아웃을 복제하지 않음

디자인 토큰 방향:

```text
배경: 밝은 중성색
카드: 흰색 또는 매우 옅은 회색
기본 텍스트: 짙은 네이비 또는 차콜
보조 텍스트: 중성 회색
브랜드 포인트: 인디고 또는 청보라
정상 상태: 에메랄드
주의 상태: 앰버
자리 비움: 중성 그레이 또는 레드
```

스타일 원칙:

- `rounded-xl` 또는 `rounded-2xl`
- 약한 border
- 매우 약한 shadow
- 과도한 글래스모피즘 금지
- 과도한 그라데이션 금지
- 형광색 금지
- 애니메이션은 짧고 차분하게
- 색상만으로 상태를 전달하지 않고 아이콘과 텍스트를 함께 사용

shadcn/ui 사용 후보:

- Button
- Card
- Badge
- Tabs
- Switch
- Slider
- Progress
- Sheet
- Drawer
- Dialog
- DropdownMenu
- Select
- Tooltip
- Alert
- Sonner
- Skeleton
- Separator
- Accordion
- Collapsible

---

## 8. 데스크톱과 모바일 레이아웃

### 데스크톱

```text
왼쪽 사이드바
- studylog 로고
- 오늘
- 기록
- 그룹
- 설정

중앙
- 대형 순공 타이머
- 카메라 화면
- MediaPipe 관절 오버레이
- 세션 시작·일시정지·종료

오른쪽
- 현재 상태
- 현재 조도
- 오늘의 요약
- 접이식 데모 센서 패널
```

### 모바일

```text
상단
- studylog
- 설정 버튼

본문
- 대형 순공 타이머
- 현재 상태
- 현재 조도
- 세션 버튼
- 접을 수 있는 카메라 카드

하단 고정 내비게이션
- 오늘
- 기록
- 그룹
- 설정
```

모바일 원칙:

- 하단 내비게이션 고정
- `safe-area-inset` 적용
- 44px 미만 터치 영역 금지
- hover 전용 기능 금지
- 카메라 카드 접기 가능
- 모바일에서는 Dialog보다 Drawer 또는 Sheet 우선
- 순공 타이머를 가장 중요한 요소로 표시
- 가로 스크롤 금지
- 360px 폭에서도 깨지지 않음

---

## 9. 랜딩 페이지

랜딩 페이지는 과제 소개 페이지가 아니라 실제 SaaS 서비스 홈페이지처럼 구현한다.

### Hero

```text
studylog

공부한 시간보다,
공부한 상태까지 기록하세요.

웹캠 기반 자세 분석과 학습 공간의 밝기 데이터를 이용해
착석 상태, 자세 변화, 권장 조건 학습 시간을 기록합니다.
```

CTA:

```text
[무료로 시작하기] → /app
[심사위원 데모] → /app?demo=1
[작동 방식 보기] → 페이지 내 기능 섹션
```

섹션:

1. 기존 공부 타이머의 한계
2. studylog의 순공 시간 정의
3. Teachable Machine 자세 분류
4. MediaPipe 기준 자세 분석
5. 가상 조도 센서
6. 상태 안정화와 경고
7. 세션 리포트
8. 개인정보 보호
9. 그룹 UI 미리보기
10. 최종 CTA

금지:

- 존재하지 않는 사용자 수
- 존재하지 않는 후기
- 존재하지 않는 수상 이력
- 과장된 정확도
- 집중력 정확 측정
- 거북목 진단
- 시력 저하 예방 보장

개인정보 문구:

```text
카메라 영상은 브라우저 안에서 실시간 분석에만 사용되며
원본 영상과 이미지는 저장되거나 서버로 전송되지 않습니다.
```

---

## 10. 그룹 기능

그룹 페이지는 제품 확장 가능성을 보여주기 위한 **정적 UI 데모**다.

더미 데이터는 소스 코드의 상수 배열만 사용한다.

```ts
export const DEMO_GROUP = {
  id: "demo-group-1",
  name: "시험기간 집중반",
  description: "각자의 목표를 향해 공부하는 UI 데모 그룹입니다.",
  todayTotalMinutes: 842,
  members: [
    {
      id: "me",
      name: "나",
      status: "STUDYING",
      subject: "수학",
      effectiveStudyMinutes: 148,
      goalProgress: 74,
    },
    {
      id: "member-2",
      name: "민준",
      status: "BREAK",
      subject: "영어",
      effectiveStudyMinutes: 126,
      goalProgress: 63,
    },
    {
      id: "member-3",
      name: "서연",
      status: "OFFLINE",
      subject: null,
      effectiveStudyMinutes: 94,
      goalProgress: 47,
    },
  ],
};
```

표시:

- 그룹명
- 설명
- 멤버 목록
- 공부 중 / 휴식 / 오프라인
- 오늘의 순공 시간
- 과목
- 목표 달성률
- 그룹 총 순공 시간
- 정적 주간 랭킹

버튼은 UI만 만들고 모두 `disabled` 처리한다.

- 방 만들기
- 초대하기
- 초대 코드 입력
- 참가하기
- 초대 링크 복사
- 그룹 설정

각 비활성 버튼에 `추후 지원 예정` Tooltip 또는 Badge를 표시한다.

다음을 절대 사용하지 않는다.

- fetch
- axios
- WebSocket
- Supabase
- Firebase
- 인증 SDK
- 환경 변수
- 서버 함수

그룹 페이지에 `UI 데모` Badge를 표시한다.

---

## 11. 세션 생명주기와 상태 타입

```ts
type SessionLifecycle =
  | "IDLE"
  | "INITIALIZING"
  | "CALIBRATING"
  | "RUNNING"
  | "PAUSED"
  | "FINISHED"
  | "ERROR";
```

Teachable Machine 클래스:

```ts
type TmPoseLabel =
  | "GOOD_POSTURE"
  | "FORWARD_LEAN"
  | "SIDE_LEAN"
  | "RESTING";
```

원시 자세 상태:

```ts
type RawPostureState =
  | "GOOD"
  | "FORWARD"
  | "SIDE"
  | "RESTING"
  | "NO_POSE"
  | "UNKNOWN";
```

안정화된 자세 상태:

```ts
type StablePostureState =
  | "GOOD"
  | "BAD"
  | "AWAY"
  | "UNKNOWN";
```

조도 상태:

```ts
type LuxStatus =
  | "DARK"
  | "DIM"
  | "RECOMMENDED"
  | "BRIGHT"
  | "TOO_BRIGHT";
```

사용자 표시 상태:

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

조합:

```text
GOOD + RECOMMENDED
→ STUDYING

BAD + RECOMMENDED
→ POSTURE_CAUTION

GOOD + 비권장 조도
→ LUX_CAUTION

BAD + 비권장 조도
→ MULTI_CAUTION

AWAY
→ AWAY

UNKNOWN
→ 기존 안정 상태 유지 또는 CHECKING
```

---

## 12. 카메라 관리

`CameraManager`는 앱 전체에서 단 하나의 `MediaStream`을 생성한다.

동일한 `<video>` 요소를 다음 엔진이 공유한다.

- `MediaPipePoseEngine`
- `TeachableMachinePoseClassifier`

절대 다음을 만들지 않는다.

```text
MediaPipe용 getUserMedia()
+
Teachable Machine용 getUserMedia()
```

`CameraManager` 책임:

- 카메라 권한 요청
- 비디오 장치 목록 조회
- 선택 장치의 stream 생성
- video element에 연결
- 카메라 변경
- 좌우 반전 설정
- track 종료
- 페이지 이동 시 정리
- 스트림 중단 감지
- 오류 코드의 사용자 문구 변환

처리할 오류:

- 권한 거부
- 카메라 없음
- 카메라가 다른 앱에서 사용 중
- HTTPS가 아닌 환경
- MediaDevices 미지원
- 스트림 중단

오류 UI:

- 설명
- 다시 시도
- 권한 설정 안내
- 카메라 없이 Mock 데모 보기

---

## 13. Teachable Machine Pose 입력 파이프라인

Teachable Machine Pose 모델은 자체 PoseNet 추정을 수행한 뒤 분류기를 실행한다.

공식 흐름을 따라 다음 순서로 호출한다.

```text
shared video 또는 inference canvas
→ model.estimatePose(...)
→ posenetOutput
→ model.predict(posenetOutput)
→ 클래스 확률
```

`tmPose.Webcam` 유틸리티는 사용하지 않는다. 해당 유틸리티가 별도의 웹캠 흐름을 만들 수 있기 때문이다.

하나의 shared video에서 중앙 정사각형 영역을 잘라 hidden canvas로 만든다.

```text
video
→ center square crop
→ hidden TM inference canvas
→ estimatePose
→ predict
```

이유:

- Teachable Machine Pose 학습 화면은 정사각형 입력에 가깝다.
- 실제 앱 입력도 유사한 구도를 사용해야 한다.
- 랜딩 또는 UI 비율과 모델 입력 비율을 분리한다.

좌우 반전 설정은 하나의 값으로 관리한다.

```ts
mirrorCamera: boolean
```

다음 요소에 일관되게 적용한다.

- 사용자에게 보이는 비디오
- MediaPipe 오버레이
- Teachable Machine 입력
- 캘리브레이션 좌표

좌우 반전이 두 번 적용되지 않도록 테스트한다.

---

## 14. TeachableMachinePoseClassifier

인터페이스:

```ts
interface PostureClassifier {
  initialize(): Promise<void>;
  predict(
    input: HTMLVideoElement | HTMLCanvasElement
  ): Promise<PosturePrediction>;
  dispose(): void;
}
```

구현체:

- `MockPostureClassifier`
- `TeachableMachinePoseClassifier`

`TeachableMachinePoseClassifier` 책임:

- `model.json`과 `metadata.json` 로딩
- 클래스 목록 검증
- `estimatePose()` 실행
- `predict()` 실행
- 클래스별 확률 정규화
- 최고 확률 클래스 반환
- PoseNet keypoints를 필요 시 내부 디버그 용도로 반환
- 평균 추론 시간 계산
- 예외 처리
- 자원 정리

반환 타입:

```ts
interface PosturePrediction {
  label: TmPoseLabel | null;
  confidence: number;
  probabilities: Record<TmPoseLabel, number>;
  inferenceMs: number;
  timestamp: number;
}
```

초기 추론 주기:

```text
초당 약 3~4회
```

컴퓨터 성능이 부족하면 자동으로 2회까지 낮출 수 있는 설정을 둔다.

Teachable Machine 자체 스켈레톤은 사용자 화면에 그리지 않는다. 화면 오버레이는 MediaPipe만 사용한다.

---

## 15. MediaPipe Pose Landmarker

MediaPipe 역할:

1. 사람 존재 여부 확인
2. 관절 오버레이
3. 사용자별 기준 자세 캘리브레이션
4. 기준 자세와 현재 자세의 상대적 편차
5. Teachable Machine의 GOOD 결과 보조 검증

초기 설정:

- `PoseLandmarker` Lite 모델
- `runningMode: "VIDEO"`
- `numPoses: 1`
- 로컬 `.task` 파일
- GPU delegate 우선, 실패 시 CPU fallback
- 필요한 confidence 값을 설정 객체로 분리

모델 위치:

```text
public/models/mediapipe/pose_landmarker_lite.task
```

초기 추론 주기:

```text
초당 약 6~8회
```

모든 웹캠 프레임에서 실행하지 않는다.

MediaPipe 결과는 다음 관절을 중심으로 사용한다.

- 코
- 양쪽 귀
- 양쪽 어깨
- 양쪽 팔꿈치
- 양쪽 손목
- 골반은 화면에 보일 때만 선택적으로 사용

정확한 척추 각도 또는 의료적 자세로 표현하지 않는다.

---

## 16. 기준 자세 캘리브레이션

UX:

```text
1. 바른 자세 안내
2. 3초 카운트다운
3. 2.5초 동안 유효 샘플 수집
4. 특징별 중앙값 계산
5. CalibrationProfile 저장
6. 완료 또는 재시도
```

유효 조건:

- 코 확인
- 양쪽 어깨 확인
- landmark visibility 기준 통과
- 어깨 너비 최소값 통과
- 최소 15개 이상의 유효 샘플
- 사용자가 화면 중앙에서 크게 벗어나지 않음

저장 특징:

- 어깨 너비
- 귀 사이 또는 얼굴 크기 / 어깨 너비
- 코와 어깨 중심의 세로 거리 / 어깨 너비
- 양쪽 어깨 높이 차이 / 어깨 너비
- 얼굴 중심의 좌우 위치 / 어깨 너비

여러 프레임의 중앙값을 사용한다.

```ts
interface CalibrationProfile {
  id: string;
  createdAt: string;
  cameraDeviceId?: string;
  mirrorCamera: boolean;
  shoulderWidth: number;
  faceScaleRatio: number;
  noseToShoulderRatio: number;
  shoulderTiltRatio: number;
  headHorizontalOffsetRatio: number;
}
```

카메라 장치 또는 좌우 반전이 바뀌면 재등록을 안내한다.

표현:

```text
사용자가 등록한 기준 자세와 현재 자세의 상대적 차이를 분석합니다.
```

---

## 17. MediaPipe 편차 분석

`PostureDeviationAnalyzer`를 만든다.

초기 특징:

- 얼굴 크기 변화
- 머리 세로 위치 변화
- 어깨 기울기 변화
- 얼굴 좌우 이동

길이 특징은 어깨 너비로 정규화한다.

```ts
interface PostureDeviation {
  score: number;
  reasons: Array<
    | "FACE_TOO_CLOSE"
    | "HEAD_DROPPED"
    | "SHOULDER_TILTED"
    | "BODY_SHIFTED"
  >;
  rawFeatures: {
    faceScaleRatio: number;
    noseToShoulderRatio: number;
    shoulderTiltRatio: number;
    headHorizontalOffsetRatio: number;
  };
}
```

초기 임계값은 설정 객체 하나에 모은다.

```ts
interface CalibrationThresholds {
  faceScaleDelta: number;
  headDropDelta: number;
  shoulderTiltDelta: number;
  horizontalOffsetDelta: number;
  badScoreThreshold: number;
}
```

임계값은 하드코딩을 여러 파일에 흩뜨리지 않는다.

---

## 18. Teachable Machine과 MediaPipe 융합

`PostureFusionEngine`을 만든다.

초기 규칙:

### 사람 없음

MediaPipe에서 유효 포즈가 없으면 `NO_POSE` 후보를 반환한다.

### 낮은 신뢰도

Teachable Machine 최고 확률이 최소 신뢰도보다 낮으면 `UNKNOWN`.

초기 최소 신뢰도:

```text
0.55
```

설정 객체로 분리한다.

### 나쁜 자세

최고 확률 클래스가 다음 중 하나이고 신뢰도를 통과하면 해당 원시 상태를 반환한다.

- `FORWARD_LEAN` → `FORWARD`
- `SIDE_LEAN` → `SIDE`
- `RESTING` → `RESTING`

### 정상 자세

TM이 `GOOD_POSTURE`이고 MediaPipe 편차가 정상 범위면 `GOOD`.

### TM GOOD이지만 기준 편차가 큼

TM이 `GOOD_POSTURE`이어도 MediaPipe 편차 점수가 매우 높으면 `FORWARD` 또는 `SIDE`에 가까운 BAD 후보로 내린다. 구체적 라벨을 확신할 수 없으면 `FORWARD`로 임의 지정하지 말고 `UNKNOWN` 또는 별도 `BASELINE_DEVIATION` reason을 가진 BAD 후보로 처리한다.

핵심 규칙:

```text
TM BAD
→ BAD 원시 상태

TM GOOD + MediaPipe 정상
→ GOOD

TM GOOD + MediaPipe 큰 편차
→ BAD 후보 + BASELINE_DEVIATION reason

TM 저신뢰도
→ UNKNOWN

MediaPipe 포즈 없음
→ NO_POSE
```

반환 타입:

```ts
interface FusedPostureResult {
  rawState: RawPostureState;
  tmLabel: TmPoseLabel | null;
  tmConfidence: number;
  probabilities: Record<TmPoseLabel, number> | null;
  poseDetected: boolean;
  deviationScore: number | null;
  reasons: string[];
  timestamp: number;
}
```

---

## 19. 자세 상태 안정화

한 번의 예측으로 상태를 바꾸지 않는다.

`PostureStateMachine`을 별도 클래스로 구현한다.

최근 원시 결과 12개를 ring buffer로 보관한다.

```text
최근 12개 중 같은 상태가 8개 이상
→ 후보 상태
```

후보가 일정 시간 유지돼야 안정 상태를 바꾼다.

```text
GOOD 후보:
1.5초

BAD 후보:
3초

NO_POSE:
2.5초

UNKNOWN:
최대 2초 동안 이전 안정 상태 유지
```

자리 비움은 MediaPipe의 실제 미검출 지속시간을 우선한다.

BAD는 다음 원시 상태를 합친다.

- FORWARD
- SIDE
- RESTING
- BASELINE_DEVIATION

필수 단위 테스트:

1. GOOD 한 번으로 상태가 바뀌지 않음
2. GOOD이 충분히 지속되면 GOOD
3. BAD가 짧게 나타나면 기존 GOOD 유지
4. BAD가 충분히 지속되면 BAD
5. 포즈가 잠깐 사라져도 AWAY가 되지 않음
6. 2.5초 이상 사라지면 AWAY
7. UNKNOWN 2초 이내에는 기존 상태 유지
8. UNKNOWN이 길어지면 CHECKING
9. AWAY 후 사람이 돌아오면 다시 안정화 과정을 거침
10. inference 주기가 조금 흔들려도 시간 기준이 유지됨

---

## 20. 조도 센서

실제 하드웨어 센서를 사용하지 않는다.

인터페이스:

```ts
interface LuxProvider {
  getLux(): number;
}
```

구현:

```ts
class MockLuxProvider implements LuxProvider {
  private lux = 620;

  setLux(value: number): void {
    this.lux = value;
  }

  getLux(): number {
    return this.lux;
  }
}
```

기본 조도 상태:

```text
0~299:
DARK

300~499:
DIM

500~700:
RECOMMENDED

701~1000:
BRIGHT

1001 이상:
TOO_BRIGHT
```

프로젝트 기본값일 뿐 의료 기준이라고 표현하지 않는다.

심사위원용 패널:

```text
데모 센서 제어
가상 센서 Badge

0~1500 Lux Slider

[어두운 환경] 200 Lux
[적정 환경] 620 Lux
[밝은 환경] 1200 Lux
```

`/app?demo=1`에서는 패널을 기본으로 펼친다.

일반 `/app`에서는 접힌 상태로 둔다.

---

## 21. 조도 상태 안정화와 경고

`LuxStateMachine`을 만든다.

- raw Lux 값은 즉시 화면에 표시한다.
- timer와 경고에 사용하는 안정화된 Lux 상태는 3초 지속 후 변경한다.
- 임계점 주변에서 반복 전환되지 않도록 작은 hysteresis를 적용한다.
- hysteresis 값은 설정 객체로 분리한다.

낮은 조도 경고:

```text
주변이 너무 어둡습니다.
스탠드를 켜 학습 공간의 밝기를 조절해 주세요.
```

높은 조도 경고:

```text
주변이 지나치게 밝습니다.
화면이나 책상에 강한 반사가 없는지 확인해 주세요.
```

경고 UI:

- shadcn Alert
- Sonner Toast
- 조도 게이지 상태
- 카메라 영역의 약한 비네팅
- 설정이 ON일 때만 짧은 경고음

조도 경고 쿨다운:

```text
60초
```

화면 전체를 읽기 어렵게 어둡게 만들지 않는다.

---

## 22. 자세 경고

BAD 안정 상태가 확정됐다고 즉시 소리를 내지 않는다.

```text
BAD 15초 지속
→ 자세 경고 1회
```

동일 경고 쿨다운:

```text
120초
```

원인 우선순위:

1. RESTING
2. FORWARD_LEAN
3. SIDE_LEAN
4. BASELINE_DEVIATION

예시:

```text
상체가 기준 자세보다 앞으로 이동한 상태가 지속되고 있습니다.
자세를 잠시 확인해 주세요.
```

```text
몸이 한쪽으로 기울어진 상태가 지속되고 있습니다.
편안한 자세로 다시 앉아 주세요.
```

---

## 23. 타이머

`SessionTimer`는 `setInterval` 횟수를 단순히 더하지 않고 `performance.now()` 기반 delta를 사용한다.

```ts
interface SessionDurations {
  totalSessionMs: number;
  effectiveStudyMs: number;
  seatedMs: number;
  postureCautionMs: number;
  awayMs: number;
  luxCautionMs: number;
}
```

정의:

### totalSessionMs

세션 lifecycle이 `RUNNING`인 전체 시간.

수동 `PAUSED` 시간은 제외한다.

자리 비움 시간은 포함한다.

### seatedMs

사람이 감지된 시간.

### effectiveStudyMs

기본 설정에서 다음을 모두 만족할 때 증가한다.

```text
RUNNING
+ 자세 GOOD
+ 조도 RECOMMENDED
```

### postureCautionMs

사람이 존재하면서 자세가 BAD인 시간.

### awayMs

사람이 감지되지 않은 시간.

### luxCautionMs

사람이 존재하면서 조도가 RECOMMENDED가 아닌 시간.

`postureCautionMs`와 `luxCautionMs`는 동시에 증가할 수 있다. 따라서 세부 시간의 합이 전체 시간과 항상 같다고 가정하지 않는다.

브라우저 탭이 숨겨지면 AI 신뢰성이 떨어질 수 있으므로 `visibilitychange`에서 세션을 자동 일시정지하고 사용자에게 안내한다.

---

## 24. 순공 시간 계산 설정

```ts
countLuxInEffectiveTime: boolean
```

기본값:

```text
true
```

ON:

```text
GOOD + RECOMMENDED
→ 순공 시간 증가
```

OFF:

```text
GOOD
→ 순공 시간 증가

조도는 경고와 통계만 기록
```

설정 설명:

```text
조도 조건을 순공 시간 계산에 포함합니다.
끄더라도 조도 경고와 기록은 유지됩니다.
```

---

## 25. 타이머 표시 설정

```ts
interface TimerVisibilitySettings {
  showEffectiveStudyTime: true;
  showTotalSessionTime: boolean;
  showPostureCautionTime: boolean;
  showAwayTime: boolean;
  showLuxCautionTime: boolean;
}
```

기본값:

```text
순공 시간:
항상 표시

전체 세션:
OFF

자세 주의:
OFF

자리 비움:
OFF

조도 주의:
OFF
```

자리 비움 시간은 내부 기록하되 기본 메인 화면에 표시하지 않는다.

AWAY 상태에서는 다음 문구만 표시한다.

```text
자리를 비워 순공 타이머가 일시정지되었습니다.
```

---

## 26. 메인 앱 화면

기본 표시:

- 대형 순공 타이머
- 현재 상태
- 현재 조도
- 선택 과목
- 목표 시간
- 세션 시작·일시정지·종료
- 카메라 미리보기
- MediaPipe 관절 오버레이
- 캘리브레이션 상태

기본 숨김:

- 전체 세션 시간
- 자세 주의 시간
- 자리 비움 시간
- 조도 주의 시간

예시:

```text
순공 시간
01:24:31

🟢 학습 중

현재 조도
620 Lux · 적정
```

---

## 27. 세션 시작 UX

입력:

- 과목
- 목표 시간
- 카메라 사용 여부
- 기준 자세 프로필

흐름:

```text
과목 선택
→ 카메라 권한
→ MediaPipe 로딩
→ TM Pose 모델 로딩
→ 캘리브레이션 확인
→ 필요 시 기준 자세 등록
→ 세션 시작
```

과목은 선택 사항이다.

기본 과목:

- 수학
- 영어
- 국어
- 과학
- 코딩
- 기타

사용자 정의 과목은 로컬에만 저장한다.

---

## 28. 설정 페이지

### 타이머 표시

- 전체 세션
- 자세 주의
- 자리 비움
- 조도 주의

### 순공 계산

- 조도 조건 반영

### 카메라

- 카메라 미리보기
- 관절 오버레이
- 좌우 반전
- 카메라 장치 선택
- 권한 재요청

### AI

- 기준 자세 다시 등록
- 자세 민감도: 낮음 / 보통 / 높음
- TM 최소 신뢰도
- 안정화 로직 설명

### 조도

- 어두움 경고값
- 권장 최소
- 권장 최대
- 과도한 밝기 경고값

기본:

```text
어두움: 300
권장 최소: 500
권장 최대: 700
과도한 밝기: 1000
```

Zod 검증:

```text
어두움
<
권장 최소
<
권장 최대
<
과도한 밝기
```

### 알림

- 자세 경고음
- 조도 경고음
- Toast
- 쿨다운

### 개인정보

- 원본 영상 미저장 안내
- 캘리브레이션 초기화
- 모든 로컬 세션 삭제

---

## 29. 세션 로그

원본 영상, 이미지, 음성을 저장하지 않는다.

1초마다 요약 샘플을 저장한다.

```ts
interface SessionSample {
  sessionId: string;
  timestamp: string;
  elapsedMs: number;
  subject: string | null;

  tmLabel: TmPoseLabel | null;
  tmConfidence: number | null;
  tmGoodProbability: number | null;
  tmForwardProbability: number | null;
  tmSideProbability: number | null;
  tmRestingProbability: number | null;

  poseDetected: boolean;
  deviationScore: number | null;
  deviationReasons: string[];

  stablePostureState: StablePostureState;

  lux: number;
  luxStatus: LuxStatus;

  studyStatus: StudyStatus;

  totalSessionMs: number;
  effectiveStudyMs: number;
  seatedMs: number;
  postureCautionMs: number;
  awayMs: number;
  luxCautionMs: number;
}
```

요약:

```ts
interface SessionSummary {
  id: string;
  subject: string | null;
  startedAt: string;
  endedAt: string;
  totalSessionMs: number;
  effectiveStudyMs: number;
  seatedMs: number;
  postureCautionMs: number;
  awayMs: number;
  luxCautionMs: number;
  recommendedLuxRatio: number;
  goodPostureRatio: number;
  tmModelVersion: string;
  calibrationProfileId: string | null;
}
```

---

## 30. 저장 구조

localStorage:

- 사용자 설정
- 타이머 표시 설정
- 조도 범위
- 마지막 과목
- 캘리브레이션
- 카메라 장치
- 좌우 반전

IndexedDB:

- SessionSummary
- SessionSample
- EvaluationRecord

UI 컴포넌트에서 직접 IndexedDB를 호출하지 않는다.

Repository 계층:

- `SettingsRepository`
- `SessionRepository`
- `EvaluationRepository`

IndexedDB가 실패하면 오류 안내 또는 메모리 fallback을 제공한다.

---

## 31. 기록 페이지

탭:

- 일간
- 주간
- 과목별

기본 표시:

- 순공 시간
- 목표 달성률
- 적정 조도 유지율
- 기준 자세 유지율
- 최근 세션

상세:

- 전체 세션
- 자세 주의
- 자리 비움
- 조도 주의

차트:

- 일주일 순공 시간
- 과목별 시간
- 적정 조도 유지율
- 기준 자세 유지율

실제 기록이 없으면 Empty State를 표시한다.

데모 데이터는 `데모`라고 표시한다.

---

## 32. 세션 리포트

세션 종료 후:

```text
/report/:sessionId
```

기본:

- 순공 시간
- 목표 달성률
- 적정 조도 유지율
- 기준 자세 유지율

차트:

1. 상태 타임라인
2. 조도 변화 선 그래프
3. 자세 클래스 분포
4. 조도 상태 분포

자리 비움 등은 기본적으로 접힌 상세 기록 안에 배치한다.

CSV:

- 상세 세션 CSV
- 요약 CSV

---

## 33. 모델 평가 페이지

라우트:

```text
/evaluate
```

입력:

- 참여자 코드
- 실제 자세 라벨
- 환경 메모
- 조명 메모
- 카메라 거리 메모

실제 라벨:

- GOOD_POSTURE
- FORWARD_LEAN
- SIDE_LEAN
- RESTING

흐름:

```text
라벨 선택
→ 3초 카운트다운
→ 3초 동안 TM Pose 예측 수집
→ 클래스별 평균 확률 계산
→ 최고 평균 확률을 최종 예측
→ 정답 여부 저장
```

```ts
interface EvaluationRecord {
  id: string;
  createdAt: string;
  participantCode: string;
  actualLabel: TmPoseLabel;
  predictedLabel: TmPoseLabel;
  averageConfidence: number;
  probabilities: Record<TmPoseLabel, number>;
  correct: boolean;
  modelVersion: string;
  environmentNote: string;
}
```

CSV 다운로드를 제공한다.

---

## 34. Python 객체지향 분석 프로그램

구조:

```text
python/
├─ studylog_analysis/
│  ├─ __init__.py
│  ├─ loader.py
│  ├─ preprocessor.py
│  ├─ posture_analyzer.py
│  ├─ lux_analyzer.py
│  ├─ model_evaluator.py
│  ├─ chart_generator.py
│  ├─ report_generator.py
│  └─ cli.py
├─ tests/
├─ requirements.txt
└─ README.md
```

클래스:

### SessionDataLoader

- 세션 CSV
- 평가 CSV
- 파일 존재 확인
- 필수 컬럼 확인
- 명확한 오류

### SessionPreprocessor

- timestamp 파싱
- 결측값 처리
- 잘못된 Lux 처리
- 중복 제거
- 타입 변환
- 상태값 검증

### PostureAnalyzer

- 자세 상태별 시간
- 기준 자세 유지율
- 클래스 분포
- 평균 신뢰도
- 경고 이유

### LuxAnalyzer

- 조도 상태별 시간
- 적정 조도 유지율
- 어두운 구간
- 밝은 구간
- 변화 통계

### ModelEvaluator

- 전체 정확도
- 클래스별 정확도
- precision
- recall
- F1
- confusion matrix
- 참여자별 정확도
- 가장 많이 혼동된 클래스

### ChartGenerator

matplotlib:

- confusion_matrix.png
- session_breakdown.png
- lux_timeline.png
- posture_distribution.png
- accuracy_by_participant.png

### ReportGenerator

- 터미널 요약
- summary.json
- summary.txt
- 생성 파일 목록

### StudyLogCLI

전체 실행 순서를 관리한다.

실행:

```bash
python -m studylog_analysis.cli \
  --session ../data/session.csv \
  --evaluation ../data/evaluation.csv \
  --output ../reports
```

Python 요구:

- 타입 힌트
- docstring
- 예외 처리
- 최소 3개 이상의 클래스
- 실제 실행 가능
- 샘플 CSV
- README
- Python을 웹 서버로 사용하지 않음

---

## 35. PWA

핵심 AI 기능 완료 후 구현한다.

```text
name: studylog
short_name: studylog
display: standalone
```

기능:

- 홈 화면 설치
- 아이콘
- theme color
- 앱 셸 캐시
- 랜딩·기록·설정 오프라인 조회
- 새 버전 알림

오래된 AI 모델이 캐시에 남지 않도록 모델 버전을 관리한다.

---

## 36. Vercel

루트 `vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

요구:

- Vite framework
- output `dist`
- 환경 변수 없이 작동
- `/app` 직접 접근
- `/evaluate` 직접 접근
- `/report/test` 새로고침
- 카메라 권한
- 모델 상대 경로
- 파일명 대소문자

---

## 37. 성능

권장 주기:

```text
웹캠 표시:
requestAnimationFrame

MediaPipe:
초당 6~8회

Teachable Machine Pose:
초당 3~4회

타이머:
초당 1회 UI 갱신

세션 로그:
초당 1회
```

주의:

- 모델 중복 로딩 금지
- 페이지 이동 시 추론 루프 종료
- MediaStream track 정리
- setInterval 중복 금지
- React StrictMode 이중 초기화 방지
- canvas 크기 매 프레임 재설정 금지
- 모델 준비 전 predict 금지
- 탭 숨김 시 자동 일시정지
- 장시간 세션의 메모리 누수 방지

Web Worker는 처음부터 넣지 않는다. 실제 성능 문제가 확인될 때 MediaPipe 이동을 검토한다.

---

## 38. 개인정보와 표현

저장하지 않음:

- 영상
- 이미지 프레임
- 얼굴 사진
- 신체 이미지
- 음성

저장 가능:

- 자세 클래스
- 확률
- 편차 점수
- 조도값
- 상태별 시간
- 세션 통계

금지 표현:

- 집중력 정확 측정
- 거북목 진단
- 척추 상태 진단
- 시력 저하 예방 보장
- 모든 자세 정확 인식
- 실제 조도 센서 연결

권장 표현:

- 관찰 가능한 자세 분류
- 등록한 기준 자세와 비교
- 설정 범위를 벗어난 조도 안내
- 가상 센서로 연동 구조 시뮬레이션
- 환경에 따라 오분류 가능

---

## 39. 접근성

- 모든 입력에 label
- 아이콘 버튼 aria-label
- Slider 현재 Lux 안내
- 색상 외 텍스트·아이콘 상태 표현
- 키보드 탐색
- focus-visible
- 모달 focus 관리
- reduced motion
- 충분한 대비
- disabled 이유 Tooltip
- 카메라 대체 설명

---

## 40. 필수 테스트

### PostureStateMachine

- 다수결
- GOOD 지속
- BAD 지속
- AWAY 지속
- UNKNOWN 유지
- AWAY 복귀

### LuxStateMachine

- Lux 범위
- 3초 안정화
- hysteresis
- 설정 변경

### SessionTimer

- GOOD + 권장 조도에서 순공 증가
- BAD에서 자세 주의 증가
- AWAY에서 자리 비움 증가
- 수동 pause에서 정지
- Lux 반영 ON/OFF
- delta 기반 누적

### PostureFusionEngine

- TM BAD
- TM GOOD + 정상 편차
- TM GOOD + 큰 편차
- 낮은 신뢰도
- 포즈 미검출

명령:

```bash
npm run lint
npm run test
npm run build
```

---

## 41. 권장 폴더 구조

```text
studylog/
├─ public/
│  ├─ models/
│  │  ├─ tm-pose/
│  │  │  ├─ model.json
│  │  │  ├─ metadata.json
│  │  │  └─ weights.bin
│  │  └─ mediapipe/
│  │     └─ pose_landmarker_lite.task
│  ├─ vendor/
│  │  └─ tm-pose/
│  ├─ icons/
│  └─ sounds/
│
├─ src/
│  ├─ pages/
│  │  ├─ landing/
│  │  ├─ today/
│  │  ├─ records/
│  │  ├─ groups/
│  │  ├─ settings/
│  │  ├─ evaluation/
│  │  └─ report/
│  │
│  ├─ components/
│  │  ├─ ui/
│  │  ├─ layout/
│  │  ├─ navigation/
│  │  ├─ camera/
│  │  ├─ timer/
│  │  ├─ lux/
│  │  ├─ session/
│  │  └─ charts/
│  │
│  ├─ ai/
│  │  ├─ types.ts
│  │  ├─ CameraManager.ts
│  │  ├─ FrameSampler.ts
│  │  ├─ MediaPipePoseEngine.ts
│  │  ├─ PostureClassifier.ts
│  │  ├─ MockPostureClassifier.ts
│  │  ├─ TeachableMachinePoseClassifier.ts
│  │  ├─ CalibrationManager.ts
│  │  ├─ PostureDeviationAnalyzer.ts
│  │  ├─ PostureFusionEngine.ts
│  │  └─ PostureStateMachine.ts
│  │
│  ├─ sensors/
│  │  ├─ LuxProvider.ts
│  │  ├─ MockLuxProvider.ts
│  │  └─ LuxStateMachine.ts
│  │
│  ├─ session/
│  │  ├─ SessionTimer.ts
│  │  ├─ SessionLogger.ts
│  │  ├─ SessionRepository.ts
│  │  ├─ EvaluationRepository.ts
│  │  └─ CsvExporter.ts
│  │
│  ├─ groups/
│  │  └─ demo-group-data.ts
│  │
│  ├─ stores/
│  ├─ hooks/
│  ├─ lib/
│  ├─ types/
│  ├─ App.tsx
│  └─ main.tsx
│
├─ python/
│  ├─ studylog_analysis/
│  ├─ tests/
│  ├─ requirements.txt
│  └─ README.md
│
├─ docs/
│  ├─ PROJECT_BRIEF.md
│  └─ TECH_DECISIONS.md
│
├─ data/
├─ reports/
├─ AGENTS.md
├─ vercel.json
├─ vite.config.ts
├─ components.json
├─ package.json
└─ README.md
```

---

## 42. 구현 Phase

### Phase 1 — Mock 기반 앱 뼈대

- React + TypeScript + Vite
- shadcn/ui
- 라우트
- 랜딩
- PC 사이드바
- 모바일 하단 내비게이션
- Mock 자세 제어
- Mock Lux
- 순공 타이머
- 설정
- 정적 그룹 UI
- Vercel 설정
- 기본 테스트

완료:

- Mock GOOD / BAD / AWAY
- Lux 200 / 620 / 1200
- 타이머
- 상세 시간 표시 설정
- 그룹 버튼 disabled
- 반응형
- lint/test/build

### Phase 2 — Camera + MediaPipe

- 단일 stream
- 관절 오버레이
- 사람 감지
- 캘리브레이션
- 편차
- 오류

### Phase 3 — Teachable Machine Pose

- 로컬 모델
- 호환 버전
- `estimatePose → predict`
- 확률
- 클래스 검증
- 평가 페이지 기초

### Phase 4 — 융합과 안정화

- FusionEngine
- PostureStateMachine
- LuxStateMachine
- 경고
- 쿨다운
- 타이머 연결
- 테스트

### Phase 5 — 데이터와 리포트

- IndexedDB
- 세션 로그
- 리포트
- 차트
- CSV
- 평가 CSV

### Phase 6 — Python

- 클래스 기반 CLI
- 가공
- 모델 평가
- 혼동행렬
- 조도 분석
- 그래프

### Phase 7 — PWA와 최종 배포

- manifest
- standalone
- 아이콘
- 캐시
- Vercel QA

---

## 43. 최종 완료 조건

1. 랜딩에서 앱 이동
2. 데스크톱 웹 레이아웃
3. 모바일 앱 셸
4. Vercel 카메라 권한
5. 하나의 카메라 stream
6. MediaPipe 오버레이
7. 캘리브레이션
8. TM Pose 네 클래스
9. AWAY 처리
10. 상태 안정화
11. 자세 경고
12. Lux slider
13. 낮은 조도 경고
14. 순공 시간 크게 표시
15. 자리 비움 시간 기본 숨김
16. 설정에서 상세 시간 표시
17. 리포트
18. 세션 CSV
19. 평가 CSV
20. Python CLI
21. 정적 그룹 데이터
22. 그룹 액션 disabled
23. 그룹 네트워크 요청 없음
24. 로그인·DB·백엔드 없음
25. 영상·이미지 저장 없음
26. lint
27. test
28. production build
29. Vercel deep link
30. README

---

## 44. 지금 실행할 첫 명령

지금은 **Phase 1만 구현한다**.

실제 MediaPipe와 Teachable Machine 모델을 연결하지 않는다.

`MockPostureClassifier`로 다음을 구현한다.

```text
Mock GOOD
→ 순공 시간 증가

Mock BAD
→ 자세 주의 상태와 내부 시간 기록

Mock AWAY
→ 순공 시간 정지, 자리 비움 내부 기록

Lux 200
→ 낮은 조도 경고

Lux 620
→ 권장 조도

Lux 1200
→ 높은 조도 경고
```

그룹 페이지는 더미 데이터만 표시하고 모든 액션을 disabled 처리한다.

작업 전에 계획과 변경 파일 목록을 먼저 제시한다.

완료 후:

```bash
npm run lint
npm run test
npm run build
```

결과를 보고하고 Phase 2는 시작하지 않는다.
