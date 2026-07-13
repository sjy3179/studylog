# StudyLog

웹캠 기반 자세 분류와 주변 조도 조건을 활용해 학습 세션을 기록하는 브라우저 중심 스터디 도구입니다.

StudyLog는 카메라에서 관찰되는 자세 상태와 사용자가 입력한 조도를 바탕으로 설정 조건을 충족한 시간을 `순공 시간`으로 기록합니다. 영상 분석과 데이터 저장은 브라우저 안에서 처리되며 별도의 로그인이나 서버 전송 없이 사용할 수 있습니다.

> StudyLog의 결과는 실제 집중력 측정이나 의료 진단이 아닙니다. 카메라 환경, 사용자 위치, 조명에 따라 자세가 잘못 분류될 수 있습니다.

## 서비스 바로가기

[https://studylog-steel.vercel.app/](https://studylog-steel.vercel.app/)

카메라 기능은 HTTPS 또는 `localhost` 환경의 최신 Chromium 기반 브라우저 사용을 권장합니다.

## 주요 기능

- MediaPipe Pose Landmarker를 이용한 사람 감지와 관절 오버레이
- 3초 카운트다운과 2.5초 특징 수집을 통한 기준 자세 등록
- Teachable Machine Pose 모델의 네 가지 자세 분류
  - `GOOD_POSTURE`
  - `FORWARD_LEAN`
  - `SIDE_LEAN`
  - `RESTING`
- 최근 AI 결과와 지속 시간을 반영한 자세 상태 안정화
- `GOOD`, `BAD`, `AWAY`, `CHECKING` 상태에 따른 순공 타이머 제어
- 200·620·1200 Lux 프리셋과 조도 경고
- IndexedDB 기반 로컬 세션 기록과 비정상 종료 복구
- 일간·주간·과목별 기록 조회와 세션 리포트
- 세션 상세·요약 CSV 및 모델 평가 CSV 다운로드
- 실제 AI 모드와 기능 확인용 Mock 모드 분리
- CSV를 분석하는 Python CLI와 그래프·요약 리포트 생성

## 순공 시간 계산

기본 순공 조건은 다음과 같습니다.

```text
세션 RUNNING + 자세 GOOD + 조도 RECOMMENDED
```

설정에서 조도 조건 반영을 끄면 자세가 `GOOD`일 때 순공 시간이 증가합니다. `BAD`, `AWAY`, `CHECKING` 상태에서는 증가하지 않습니다. 자세 주의 시간과 조도 주의 시간은 동시에 기록될 수 있습니다.

## 개인정보 보호

- 카메라 권한은 사용자가 직접 카메라 시작 버튼을 누른 뒤에만 요청합니다.
- 원본 영상, 이미지 프레임, 얼굴·신체 사진과 음성을 저장하지 않습니다.
- 원본 관절 좌표를 IndexedDB나 브라우저 저장소에 보관하지 않습니다.
- 영상과 모델 추론 결과를 서버로 전송하지 않습니다.
- 세션 기록과 평가 결과는 현재 브라우저의 IndexedDB에만 저장됩니다.
- 브라우저 데이터를 삭제하면 로컬 기록도 함께 삭제될 수 있습니다.

## 화면 경로

| 경로 | 설명 |
| --- | --- |
| `/` | 서비스 소개 랜딩 페이지 |
| `/app` | 카메라, AI 상태, 조도와 순공 타이머 |
| `/app/records` | 로컬 학습 기록과 통계 |
| `/app/groups` | 비활성화된 그룹 기능 미리보기 |
| `/app/settings` | 타이머, 카메라, AI와 알림 설정 |
| `/report/:sessionId` | 세션 상세 리포트와 CSV 다운로드 |
| `/evaluate` | 자세 모델 평가와 4×4 혼동행렬 |

## 기술 구성

- React 19, TypeScript, Vite
- Tailwind CSS, shadcn/ui, Radix UI
- React Router, Zustand
- MediaPipe Tasks Vision
- TensorFlow.js, Teachable Machine Pose, PoseNet
- IndexedDB
- Vitest, Testing Library, ESLint
- Python 3.11+, pandas, matplotlib, pytest, Ruff
- Vercel SPA 배포

AI와 MediaPipe 모델 자산은 모두 `public/` 아래의 로컬 파일을 사용하며 외부 모델 CDN에 의존하지 않습니다.

## 로컬 실행

Node.js와 npm이 필요합니다.

```bash
npm install
npm run dev
```

프로덕션 빌드와 검증:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Python CSV 분석

웹 앱에서 다운로드한 세션 표본·요약·모델 평가 CSV는 `python/`의 객체지향 CLI로 분석할 수 있습니다. 기본 분석에서는 AI 세션만 포함하며 누적 시간 컬럼을 행 단위로 합산하지 않습니다.

설치와 CLI 옵션은 [Python 분석 README](python/README.md)를 참고하세요.

```bash
cd python
python -m ruff check .
python -m pytest
python -m compileall studylog_analysis
```

## 그룹 화면 안내

그룹 화면은 서비스 형태를 보여주는 정적 미리보기입니다. 그룹 생성, 초대, 참가, 설정 버튼은 비활성화되어 있으며 네트워크 요청이나 실제 사용자 데이터 동기화를 수행하지 않습니다.
