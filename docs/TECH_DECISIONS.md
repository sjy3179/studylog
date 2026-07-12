# Phase 1 기술 결정

이 문서는 Phase 1에서 확정한 구현 경계와 교체 지점을 기록한다. 전체 제품 요구사항은 [PROJECT_BRIEF.md](PROJECT_BRIEF.md)를 따른다.

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

- 제공 파일은 Teachable Machine Pose 프로젝트가 내보낸 TensorFlow.js 모델이며 `public/models/tm-pose/`에 원본 그대로 둔다.
- 모델 클래스는 `GOOD_POSTURE`, `FORWARD_LEAN`, `SIDE_LEAN`, `RESTING`이다. `model.json`은 `weights.bin`을 참조한다.
- Phase 1 번들은 이 모델을 import, fetch, 검증 또는 추론하지 않는다. 실제 로컬 모델 연동과 런타임 버전 고정은 Phase 3에서 어댑터 내부에 격리해 결정한다.
- Phase 2는 단일 카메라 stream과 MediaPipe만 다루며 Teachable Machine 연동을 시작하지 않는다.

## 데이터와 외부 통신

- 인증, 백엔드, API, 데이터베이스, WebSocket과 그룹 네트워크 통신을 두지 않는다.
- 그룹은 코드 상수 기반 UI 데모이며 모든 변경성 액션을 비활성화한다.
- 영상·이미지·음성은 저장하거나 전송하지 않는다. 서비스 문구는 실제 집중력 측정이나 의료적 효과를 주장하지 않는다.
