# studylog 작업 규칙

이 저장소에서는 [프로젝트 마스터 지시서](docs/PROJECT_BRIEF.md)를 최우선 기준으로 삼는다.

## 공통 원칙

- 패키지 매니저는 `npm`만 사용하고 TypeScript `strict` 모드를 유지한다.
- 요청받은 Phase만 구현한다. 다음 Phase를 임의로 시작하거나 선행 구현하지 않는다.
- 화면 컴포넌트와 자세 분류, 센서, 상태 머신, 타이머, 저장 로직의 책임을 분리한다.
- 각 Phase 완료 시 `npm run lint`, `npm run test`, `npm run build`를 모두 실행하고 결과와 남은 TODO를 보고한다.

## Phase 2~4 경계

- 카메라 권한은 사용자가 버튼을 누른 뒤에만 요청하며 `CameraManager`가 한 번에 `MediaStream` 하나만 관리한다.
- MediaPipe Pose Landmarker Lite는 `/mediapipe/wasm`과 `/models/mediapipe/pose_landmarker_lite.task`의 로컬 자산만 사용한다.
- video·overlay 좌우반전은 표시용 transform 하나로 관리한다. 추론·캘리브레이션 좌표를 다시 뒤집지 않는다.
- 원본 MediaPipe result와 매 프레임 landmark 배열을 Zustand, localStorage, IndexedDB에 저장하지 않는다.
- Phase 4에서는 MediaPipe의 사람 감지·편차와 TM Pose 결과를 freshness 검증·융합·안정화한 뒤에만 실제 타이머 조건에 사용한다.
- 기존 `MockPostureClassifier`와 `MockLuxProvider`, Mock GOOD/BAD/AWAY 타이머 제어는 유지한다.
- Teachable Machine Pose 원시 추론은 Phase 3에서만 사용한다. MediaPipe/TM 융합, 실제 카메라 기반 GOOD/BAD/AWAY, 자동 타이머 제어는 Phase 4 전까지 구현하지 않는다.
- WASM 파일은 `scripts/sync-mediapipe-assets.mjs`와 `postinstall`로 패키지에서 이름 그대로 동기화한다.
- 캘리브레이션은 3초 카운트다운, 2.5초 수집, 최소 12개 유효 샘플, 특징별 중앙값을 사용하고 `studylog:calibration:v1`에 요약 프로필만 저장한다.
- route unmount·카메라 OFF·장치 변경에서 rAF, PoseLandmarker, event listener, 모든 video track을 정리한다.
- `@teachablemachine/pose@0.8.6`, `@tensorflow/tfjs@1.3.1`, `@tensorflow-models/posenet@2.2.1`, TF.js core/converter `1.3.1`을 정확히 고정하고 NPM ESM lazy runtime만 사용한다. 외부 CDN과 production UMD 이중 경로는 두지 않는다.
- 모델 경로는 `public/models/tm-pose/`이고 파일명은 `model.json`, `metadata.json`, `weights.bin`이다.
- TM 내부 PoseNet도 `public/models/tm-pose/posenet/`의 로컬 manifest와 두 shard만 사용한다.
- 모델 클래스는 정확히 `GOOD_POSTURE`, `FORWARD_LEAN`, `SIDE_LEAN`, `RESTING` 네 개다. `AWAY`는 모델 클래스가 아니다.
- TM은 기존 `CameraManager`의 동일 video element만 사용한다. `tmPose.Webcam`과 추가 `getUserMedia` 호출을 금지한다.
- TM 입력은 재사용 257px canvas의 중앙 정사각형 crop이다. mirror는 draw 단계에서 한 번만 적용하고 `estimatePose(canvas, false)`를 호출한다.
- MediaPipe는 약 6~8Hz, TM Pose는 기본 2.5Hz로 제한하고 공용 추론 coordinator, in-flight guard, hidden/OFF/unmount cleanup을 유지한다.
- TM 원시 확률 하나를 직접 타이머에 연결하지 않는다. Phase 4 융합·12개 중 8개 합의·지속시간을 통과한 안정 상태만 사용한다.
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

Phase 4 완료 보고 후 멈추며 Phase 5 저장·리포트·CSV 작업을 시작하지 않는다.
