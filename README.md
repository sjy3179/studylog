# studylog

주영이네 팀 도와주려고 시작한 Teachable Machine 웹앱 프로젝트 studylog

공부한 시간뿐 아니라 착석·자세·조도 조건을 함께 기록하는 개인용 캠스터디 웹 앱입니다. 현재 Phase 1은 실제 카메라나 AI 추론 없이 Mock 입력으로 제품 흐름과 타이머를 검증합니다.

## 시작하기

```bash
npm install
npm run dev
```

품질 검증:

```bash
npm run lint
npm run test
npm run build
```

## 주요 경로

| 경로 | 내용 |
| --- | --- |
| `/` | 서비스 소개 랜딩 페이지 |
| `/app` | 오늘의 순공 타이머와 Mock 센서 제어 |
| `/app/records` | 학습 기록 기본 UI |
| `/app/groups` | 정적 그룹 UI 데모 |
| `/app/settings` | 타이머 표시·순공 계산 설정 |
| `/evaluate` | 후속 Phase 안내 화면 |
| `/report/:sessionId` | 후속 Phase 안내 화면 |

## Phase 1 데모

- 자세 상태: `GOOD`, `BAD`, `AWAY`
- 조도: 0~1500 Lux 슬라이더와 200(낮음), 620(권장), 1200(높음) 프리셋
- 기본 순공 조건: 실행 중 + `GOOD` + 권장 조도
- 상세 시간: 설정에서 켠 항목만 메인 화면에 표시하며 자리 비움 시간은 기본으로 숨김
- 그룹: 더미 데이터만 표시하고 생성·초대·참가 등 모든 액션은 비활성화

`/app?demo=1`로 열면 데모 센서 패널을 바로 확인할 수 있습니다.

## AI 모델

제공된 파일은 Teachable Machine Image 모델이 아닌 Pose 프로젝트의 TensorFlow.js 모델입니다.

```text
public/models/tm-pose/
├─ model.json
├─ metadata.json
└─ weights.bin
```

클래스는 `GOOD_POSTURE`, `FORWARD_LEAN`, `SIDE_LEAN`, `RESTING` 네 개입니다. Phase 1에서는 파일을 정적 자산으로만 보존하며, 실제 Teachable Machine 연동은 Phase 3에서 진행합니다.

카메라 영상은 이후 Phase에서도 브라우저 안의 실시간 분석에만 사용하며 원본 영상과 이미지를 저장하거나 서버로 보내지 않습니다. studylog의 순공 시간은 실제 집중력을 측정한 값이 아니라 설정한 착석·자세·조도 조건을 충족한 시간입니다.

전체 요구사항은 [PROJECT_BRIEF.md](docs/PROJECT_BRIEF.md), 반복 작업 규칙은 [AGENTS.md](AGENTS.md), Phase 1 결정은 [TECH_DECISIONS.md](docs/TECH_DECISIONS.md)를 참고하세요.
