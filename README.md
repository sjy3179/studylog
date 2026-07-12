# studylog

Teachable Machine 웹앱 프로젝트 studylog

공부한 시간뿐 아니라 착석·자세·조도 조건을 함께 기록하는 개인용 캠스터디 웹 앱입니다. Phase 4에서는 MediaPipe의 사람 존재·기준 자세 편차와 파일럿 Teachable Machine Pose 예측을 융합하고, 안정화된 결과만 순공 타이머 조건에 사용합니다.

## 시작하기

```bash
npm install
npm run dev
```

품질 검증:

```bash
npm run lint
npm run test
npm run typecheck
npm run build
```

## 주요 경로

| 경로 | 내용 |
| --- | --- |
| `/` | 서비스 소개 랜딩 페이지 |
| `/app` | AI/Mock 모드, 순공 타이머, MediaPipe와 TM Pose 융합 |
| `/app/records` | 학습 기록 기본 UI |
| `/app/groups` | 정적 그룹 UI 데모 |
| `/app/settings` | 타이머 표시·순공 계산 설정 |
| `/evaluate` | 파일럿 TM Pose 모델 진단 화면 |
| `/report/:sessionId` | 후속 Phase 안내 화면 |

## Phase 2 카메라·MediaPipe

- 카메라는 `/app` 또는 설정의 `카메라 켜기`를 누른 뒤에만 권한을 요청합니다.
- 웹캠 기능은 `localhost` 또는 HTTPS에서 사용해야 하며 Chrome 기반 최신 브라우저를 우선 지원합니다.
- 권한 승인 후 장치를 선택·변경하고 미리보기·관절 오버레이·좌우반전을 각각 조절할 수 있습니다.
- MediaPipe는 한 명의 33개 관절을 VIDEO 모드에서 약 6~8Hz로 분석합니다.
- 기준 자세 등록은 3초 카운트다운 뒤 2.5초간 특징을 수집하고, 최소 12개 유효 샘플의 중앙값을 저장합니다.
- 저장되는 캘리브레이션 정보는 비율 특징·시각·장치 ID·품질 요약뿐입니다. 영상, 이미지, 원본 관절 배열은 저장하지 않습니다.
- 상대 편차 LOW/MEDIUM/HIGH와 사유는 정보 표시용이며 의료 진단이 아닙니다.

MediaPipe 정적 자산:

```text
public/mediapipe/wasm/
public/models/mediapipe/pose_landmarker_lite.task
```

WASM은 `npm install`의 `postinstall`에서 `@mediapipe/tasks-vision@0.10.35` 패키지로부터 자동 복사됩니다. Lite 모델은 Google AI Edge 공식 Pose Landmarker 모델을 사용합니다.

카메라 문제 해결:

- 권한 거부: 주소 표시줄의 사이트 설정에서 카메라를 허용한 뒤 다시 시도합니다.
- 장치 없음: 카메라 연결과 운영체제 개인정보 설정을 확인합니다.
- 다른 앱이 사용 중: 화상회의·카메라 앱을 닫고 다시 시도합니다.
- 모델/WASM 오류: 개발자 도구 Network에서 `/models/mediapipe/`와 `/mediapipe/wasm/`의 404 여부를 확인합니다.

## Mock 데모 유지

- 자세 상태: `GOOD`, `BAD`, `AWAY`
- 조도: 0~1500 Lux 슬라이더와 200(낮음), 620(권장), 1200(높음) 프리셋
- 기본 순공 조건: 실행 중 + `GOOD` + 권장 조도
- 상세 시간: 설정에서 켠 항목만 메인 화면에 표시하며 자리 비움 시간은 기본으로 숨김
- 그룹: 더미 데이터만 표시하고 생성·초대·참가 등 모든 액션은 비활성화

`/app?demo=1`로 열면 명시적인 Mock 모드와 데모 센서 패널을 바로 확인할 수 있습니다. 카메라·모델 오류가 나도 앱이 자동으로 Mock으로 바뀌지 않으며 사용자가 `데모 모드로 계속하기`를 선택해야 합니다. AI와 Mock은 동시에 타이머를 제어하지 않습니다.

## Phase 3 Teachable Machine Pose

- 제공 모델은 Image 프로젝트가 아닌 Teachable Machine Pose Project의 TensorFlow.js 모델입니다.
- 런타임은 `@teachablemachine/pose@0.8.6`, 해당 패키지의 정확한 peer인 `@tensorflow/tfjs@1.3.1`, 내부 PoseNet `@tensorflow-models/posenet@2.2.1`을 NPM ESM lazy chunk로 불러옵니다. TF.js core/converter도 `1.3.1`로 고정해 중복 runtime을 막습니다.
- `CameraManager`가 만든 한 개의 `MediaStream`과 `CameraPanel`의 한 개 video element를 MediaPipe와 TM Pose가 공유합니다. `tmPose.Webcam`이나 추가 `getUserMedia()`는 사용하지 않습니다.
- 16:9 또는 세로 video에서 중앙 정사각형을 257×257 canvas로 crop합니다. 좌우반전 ON이면 canvas draw 단계에서 한 번 반전한 뒤 `estimatePose(canvas, false)`를 호출합니다.
- MediaPipe는 기존 약 6~8Hz, TM Pose는 기본 400ms(2.5Hz)이며 느린 장치에서는 600ms 또는 1000ms로 완화됩니다.
- 네 클래스 원시 확률, 최고 확률 클래스, 신뢰도, pose score, 모델 상태와 평균 추론 시간을 표시합니다. 원시 값 하나가 타이머를 직접 바꾸지 않으며 Phase 4 융합·안정화 과정을 통과해야 합니다.
- runtime·model 오류 시 다시 시도하거나 카메라 없이 Mock 데모를 계속할 수 있습니다. 모든 모델·WASM 자산은 로컬이며 외부 CDN 요청이 없습니다.
- 공식 `tmPose.load()`는 PoseNet 가중치를 Google Storage에서 받기 때문에 production에서는 adapter가 동일 공식 `CustomPoseNet`을 로컬 classifier model과 로컬 PoseNet model로 구성합니다. 이후 추론 API는 공식 흐름인 `estimatePose() → predict()`를 그대로 사용합니다.

## AI 모델

제공된 파일은 Teachable Machine Image 모델이 아닌 Pose 프로젝트의 TensorFlow.js 모델입니다.

```text
public/models/tm-pose/
├─ model.json
├─ metadata.json
├─ weights.bin
└─ posenet/
   ├─ model-stride16.json
   ├─ group1-shard1of2.bin
   └─ group1-shard2of2.bin
```

클래스는 `GOOD_POSTURE`, `FORWARD_LEAN`, `SIDE_LEAN`, `RESTING` 네 개입니다. `metadata.json`을 먼저 검증하고 모델 출력도 정확히 네 클래스인지 확인합니다. `AWAY`는 모델 클래스가 아니며 MediaPipe 사람 미검출이 2.5초 지속될 때 확정합니다.

## Phase 4 AI 런타임 통합

- 정상 `/app`은 AI 모드를 우선하고 `/app?demo=1`은 비상 시연용 Mock 모드로 시작합니다.
- TM 결과는 1초, MediaPipe 결과는 600ms 이내의 신선한 값만 사용합니다. 오래된 GOOD, 낮은 신뢰도, 엔진 준비 실패는 `UNKNOWN/CHECKING`으로 처리해 순공 증가를 막습니다.
- GOOD/BAD 후보는 최근 12개 중 8개 이상 합의가 필요합니다. GOOD 1.5초, BAD 3초, 사람 미검출 2.5초가 지나야 안정 상태가 바뀝니다. UNKNOWN은 표시 상태를 최대 2초 보호하지만 그동안 순공은 증가하지 않습니다.
- 조도값은 화면에 즉시 표시하고 타이머·경고용 상태는 20 Lux hysteresis와 3초 안정화를 적용합니다.
- 기본 순공 조건은 `RUNNING + GOOD + RECOMMENDED`입니다. 설정에서 조도 반영을 끄면 GOOD만으로 증가하지만 조도 경고와 상세 시간은 유지합니다.
- BAD 15초 후 자세 경고를 한 번 표시하고 120초 쿨다운을 적용합니다. DARK/TOO_BRIGHT 경고는 60초 쿨다운을 적용합니다.
- 자세·조도·자리 비움·확인 중 시간은 내부에서 각각 기록하며 자리 비움 시간은 설정에서 켜기 전까지 기본 화면에 표시하지 않습니다.
- 파일럿 모델은 환경·거리·조명·사용자에 따라 오분류될 수 있으며 의료 진단이나 실제 집중력 측정에 사용하지 않습니다.

AI 문제 해결:

- `CAMERA_NOT_READY`: 카메라를 켜고 권한을 허용합니다.
- `CALIBRATION_REQUIRED`: 평소 학습 자세로 기준 자세를 등록합니다.
- `TM_NOT_READY` 또는 모델 오류: 모델 다시 불러오기를 시도합니다.
- 계속 사용할 수 없는 환경에서는 오류 카드의 데모 모드 버튼을 명시적으로 선택합니다.

파일럿 모델 교체 절차:

1. Teachable Machine Pose에서 TensorFlow.js 형식으로 내보냅니다.
2. `model.json`, `metadata.json`, `weights.bin`을 같은 배포에서 동시에 교체합니다.
3. 네 클래스 이름을 정확히 유지합니다.
4. `src/ai/tm-pose/tm-pose-config.ts`의 `version`을 변경합니다.
5. `npm run typecheck`, `npm run test`, `npm run build`를 실행합니다.
6. Preview Network에서 세 파일 HTTP 200과 클래스 검증을 확인합니다.

카메라 영상은 이후 Phase에서도 브라우저 안의 실시간 분석에만 사용하며 원본 영상과 이미지를 저장하거나 서버로 보내지 않습니다. studylog의 순공 시간은 실제 집중력을 측정한 값이 아니라 설정한 착석·자세·조도 조건을 충족한 시간입니다.

전체 요구사항은 [PROJECT_BRIEF.md](docs/PROJECT_BRIEF.md), [PHASE_2_BRIEF.md](docs/PHASE_2_BRIEF.md), [PHASE_3_BRIEF.md](docs/PHASE_3_BRIEF.md), [PHASE_4_BRIEF.md](docs/PHASE_4_BRIEF.md), 반복 작업 규칙은 [AGENTS.md](AGENTS.md), 기술 결정은 [TECH_DECISIONS.md](docs/TECH_DECISIONS.md)를 참고하세요.
