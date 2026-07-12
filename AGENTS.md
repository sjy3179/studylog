# studylog 작업 규칙

이 저장소에서는 [프로젝트 마스터 지시서](docs/PROJECT_BRIEF.md)를 최우선 기준으로 삼는다.

## 공통 원칙

- 패키지 매니저는 `npm`만 사용하고 TypeScript `strict` 모드를 유지한다.
- 요청받은 Phase만 구현한다. 다음 Phase를 임의로 시작하거나 선행 구현하지 않는다.
- 화면 컴포넌트와 자세 분류, 센서, 상태 머신, 타이머, 저장 로직의 책임을 분리한다.
- 각 Phase 완료 시 `npm run lint`, `npm run test`, `npm run build`를 모두 실행하고 결과와 남은 TODO를 보고한다.

## Phase 1 경계

- Phase 1은 `MockPostureClassifier`와 `MockLuxProvider`만 사용한다.
- 실제 카메라, MediaPipe, Teachable Machine 추론을 연결하거나 AI 런타임 의존성을 설치·로드하지 않는다.
- 제공 모델은 정적 자산으로만 보존하며 실제 연동은 Phase 3에서 수행한다.
- 모델 경로는 `public/models/tm-pose/`이고 파일명은 `model.json`, `metadata.json`, `weights.bin`이다.
- 모델 클래스는 정확히 `GOOD_POSTURE`, `FORWARD_LEAN`, `SIDE_LEAN`, `RESTING` 네 개다. `AWAY`는 모델 클래스가 아니다.
- 로그인, 인증, 백엔드, API, 서버 함수, 데이터베이스, Supabase, Firebase, WebSocket, 환경 변수 기반 연동을 구현하지 않는다.
- 그룹 페이지는 소스 코드의 정적 더미 데이터만 사용한다. 네트워크 요청은 금지하며 생성·초대·참가·복사·설정 액션은 모두 비활성화한다.

## 상태와 시간

- 기본 순공 조건은 세션 `RUNNING` + 자세 `GOOD` + 조도 `RECOMMENDED`다. 조도 반영 설정을 끄면 `GOOD`만 충족해도 순공 시간이 증가한다.
- `BAD`에서는 순공을 멈추고 자세 주의 시간을, `AWAY`에서는 순공을 멈추고 자리 비움 시간을 기록한다.
- 조도 주의 시간은 사람이 감지되고 조도가 비권장일 때 기록하며 자세 주의 시간과 동시에 증가할 수 있다.
- 타이머는 interval 횟수가 아니라 `performance.now()` 기반 delta로 누적한다. 수동 pause와 탭 숨김 자동 pause 중에는 시간이 증가하지 않는다.
- 순공 시간만 항상 표시한다. 전체 세션·자세 주의·자리 비움·조도 주의 시간은 기본적으로 숨기고 설정에서 켠 항목만 표시한다.

## 개인정보와 표현

- 웹캠 원본 영상, 이미지 프레임, 얼굴·신체 사진, 음성을 저장하거나 서버로 보내지 않는다.
- 실제 집중력 측정, 의료 진단, 거북목·척추 진단, 시력 보호 보장, 완전한 자세 인식으로 표현하지 않는다.
- 관찰 가능한 자세 분류와 설정 조건 충족 시간임을 명확히 하고 환경에 따라 오분류될 수 있음을 안내한다.

Phase 1 완료 보고 후 멈추며 Phase 2 MediaPipe 연동을 시작하지 않는다.
