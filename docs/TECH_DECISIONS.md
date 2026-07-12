# studylog 기술 결정

이 문서는 Phase 1~3에서 확정한 구현 경계와 교체 지점을 기록한다. 전체 제품 요구사항은 [PROJECT_BRIEF.md](PROJECT_BRIEF.md)를 따른다.

## 애플리케이션 기반

- React, TypeScript strict, Vite 기반 단일 페이지 애플리케이션으로 구성한다.
- React Router로 공개 랜딩과 `/app` 하위 화면을 분리하고, Vercel rewrite로 모든 SPA 경로의 직접 접근을 지원한다.
- Tailwind CSS와 shadcn/ui를 디자인 기반으로 사용한다. 의존성의 실제 고정 버전은 `package-lock.json`을 기준으로 한다.
- Vitest와 React Testing Library로 상태 머신, 타이머, 핵심 UI 계약을 검증한다.

## Phase 1 Mock 경계

- 자세 입력은 `MockPostureClassifier`의 `GOOD`, `BAD`, `AWAY` 상태로 시뮬레이션한다. 이는 화면·타이머 검증용 상태이며 Teachable Machine의 원본 라벨과 동일한 타입이 아니다.
- 조도 입력은 `MockLuxProvider`의 0~1500 Lux 값으로 시뮬레이션한다. 200, 620, 1200 Lux를 필수 프리셋으로 제공한다.
- Phase 4 대상인 자세 다수결·지속시간 안정화, Lux hysteresis, 경고 쿨다운은 Phase 1에 앞당겨 넣지 않는다.
- 사용자 설정만 `localStorage`에 유지한다. 세션 기록 영속화와 IndexedDB는 Phase 5 범위다.

## 타이머와 상태

- 시간 누적은 `performance.now()` 기반 경과 delta를 사용해 interval 드리프트와 느린 탭 갱신에 대응한다.
- 기본 순공 조건은 `RUNNING + GOOD + RECOMMENDED`이며 조도 반영 설정은 기본적으로 켠다.
- 자세 주의와 조도 주의 시간은 서로 배타적이지 않다. 세부 시간의 합이 전체 세션 시간과 같다고 가정하지 않는다.
- 순공 시간 외 상세 시간은 기본 화면에서 숨기고 각 설정을 켠 경우에만 표시한다. 특히 자리 비움 시간은 내부 기록하되 기본 노출하지 않는다.
- 탭이 숨겨지면 세션을 자동 일시정지한다.

## 모델 자산과 향후 교체

- 제공 파일은 Teachable Machine Pose 프로젝트가 내보낸 TensorFlow.js 모델이며 `public/models/tm-pose/`에 배치한다. 내보낸 메타데이터의 `FOWARD_LEAN` 오타는 프로젝트의 고정 클래스 계약에 맞춰 `FORWARD_LEAN`으로 정정했다.
- 모델 클래스는 `GOOD_POSTURE`, `FORWARD_LEAN`, `SIDE_LEAN`, `RESTING`이다. `model.json`은 `weights.bin`을 참조한다.
- Phase 1 번들은 이 모델을 import, fetch, 검증 또는 추론하지 않는다. 실제 로컬 모델 연동과 런타임 버전 고정은 Phase 3에서 어댑터 내부에 격리해 결정한다.
- Phase 2는 단일 카메라 stream과 MediaPipe만 다루며 Teachable Machine 연동을 시작하지 않는다.

## 데이터와 외부 통신

- 인증, 백엔드, API, 데이터베이스, WebSocket과 그룹 네트워크 통신을 두지 않는다.
- 그룹은 코드 상수 기반 UI 데모이며 모든 변경성 액션을 비활성화한다.
- 영상·이미지·음성은 저장하거나 전송하지 않는다. 서비스 문구는 실제 집중력 측정이나 의료적 효과를 주장하지 않는다.

## Phase 2 카메라와 MediaPipe

- `@mediapipe/tasks-vision`은 공식 npm의 `0.10.35`를 정확히 고정한다. React 19, Vite 8, TypeScript strict와 lint/test/build를 실제 통과한 버전만 유지한다.
- CDN script와 런타임 CDN 자산을 사용하지 않는다. 패키지의 `wasm` 전체는 `scripts/sync-mediapipe-assets.mjs`가 `public/mediapipe/wasm/`으로 복사하고, Google AI Edge 공식 Pose Landmarker Lite 모델은 `public/models/mediapipe/pose_landmarker_lite.task`에 둔다.
- 카메라 접근은 `CameraManager`에 격리한다. 사용자 클릭 전에 권한을 요청하지 않고 stream·video는 각각 하나만 사용하며 장치 변경, track 종료, route unmount에서 정리한다.
- `MediaPipePoseEngine`은 initialize Promise와 PoseLandmarker를 하나만 유지하고 GPU delegate 실패 시 CPU로 한 번 fallback한다.
- 추론은 requestAnimationFrame에서 약 140ms 간격으로 제한하고 같은 `video.currentTime`, 준비되지 않은 video, hidden 탭, in-flight 상태를 건너뛴다.
- MediaPipe 원본 결과는 앱 전체에 노출하지 않고 자체 타입으로 즉시 매핑한다. landmark 배열은 canvas 구독자에게만 전달하며 React 전역 state에는 요약값만 넣는다.
- 좌우반전은 video와 canvas의 CSS 표시 transform에만 적용한다. MediaPipe 입력과 캘리브레이션 특징은 원본 좌표를 유지한다.
- 캘리브레이션은 3초 카운트다운, 2.5초 수집, 최소 12개 유효 샘플, 중앙값과 MAD 품질 검사를 사용한다. `studylog:calibration:v1`에는 비율 기준과 품질 요약만 저장한다.
- 상대 편차와 raw presence는 정보 UI 전용이다. Phase 1 Mock 자세 상태나 `StudyStateMachine`·`SessionTimer` 입력을 변경하지 않는다.

## Phase 3 Teachable Machine Pose

- production 런타임은 `NPM_ESM` 하나만 사용한다. `@teachablemachine/pose@0.8.6`, 정확한 peer인 `@tensorflow/tfjs@1.3.1`, `@tensorflow-models/posenet@2.2.1`, TF.js core/converter `1.3.1`을 고정하고 사용자가 카메라 또는 모델 확인을 요청한 뒤 dynamic import한다. PoseNet 2.2.2는 TF.js 3.x를 요구해 제외했다. Vite 8 production build와 strict typecheck를 통과하면 local UMD fallback은 포함하지 않는다.
- 구형 TF.js 패키지 내부 TypeScript enum을 TypeScript 6이 검사할 수 있도록 `erasableSyntaxOnly`만 끈다. `strict`, `noEmit`, `skipLibCheck`와 나머지 검사 옵션은 유지한다.
- `metadata.json`은 runtime 모델보다 먼저 검증한다. 파일럿 metadata의 export TF.js 버전은 1.7.4지만 모델 topology가 Dense/Dropout과 4-class softmax로 구성되어 있어 패키지 peer runtime 1.3.1에서 실제 브라우저 load·predict를 최종 확인한다.
- 공식 `tmPose.load()`는 metadata 설정에 따라 PoseNet graph를 Google Storage에서 불러온다. 외부 CDN 금지 조건 때문에 MobileNetV1 0.75/stride16 공식 manifest와 두 shard를 `public/models/tm-pose/posenet/`에 고정하고, runtime adapter가 `tf.loadLayersModel`·`poseNet.load({ modelUrl })`·`tmPose.CustomPoseNet`으로 동일 모델을 구성한다. 추론은 공식 `estimatePose → predict` API를 그대로 사용한다.
- TM adapter는 Phase 2의 동일 video element를 입력으로 받는다. 별도 stream, `tmPose.Webcam`, 추가 `getUserMedia`는 없다.
- 입력 canvas 하나를 재사용하고 중앙 정사각형을 257px로 crop한다. mirror 설정은 canvas draw에 적용하며 `estimatePose`의 flip 인자는 항상 false다.
- MediaPipe 140ms loop와 TM 400ms loop는 `BrowserAiInferenceCoordinator`를 공유한다. TM 평균 추론이 250ms를 넘으면 600ms, 450ms를 넘으면 1000ms로 완화한다.
- TM hook의 state에는 요약 예측·모델 정보·오류·성능만 둔다. video/canvas/model/posenetOutput/tensor는 service와 ref에만 두며 원본 frame을 저장하지 않는다.
- TM 결과는 원시 확률 UI와 `/evaluate` 진단 화면에만 사용한다. Mock store와 타이머에 대한 융합은 Phase 4 범위다.
