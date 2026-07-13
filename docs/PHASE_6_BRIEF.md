# studylog Phase 6 개발 지시서

## 0. 작업 목표

이번 Phase의 목표는 Phase 5 웹 앱이 내보내는 세션 CSV와 모델 평가 CSV를 읽어, 객체지향 Python 프로그램으로 검증·가공·분석·시각화·리포트 생성까지 수행하는 것입니다.

이 Phase는 다음 두 과제 요구사항을 직접 충족하기 위한 핵심 단계입니다.

- Python 기초: Python으로 3개 이상의 클래스를 정의하고 객체를 생성해 실제 프로그램을 실행
- 데이터사이언스: 데이터 정의, 수집, 가공, 분석, 활용의 전체 과정 구현

웹 앱을 Python으로 다시 만들지 않습니다. Python은 studylog 웹 앱에서 내려받은 CSV를 분석하는 같은 프로젝트의 오프라인 분석 모듈입니다.

이번 Phase에서는 Phase 7 작업을 시작하지 않습니다.

---

## 1. Git 작업 순서

작업 전에 현재 Git 상태를 확인하세요.

Phase 5가 아직 Draft PR #5와 `agent/studylog-phase-5-data-reporting` 브랜치에 남아 있다면 다음 순서를 지키세요.

1. Phase 5의 lint, typecheck, test, build 결과 재확인
2. Phase 5 PR을 Ready for review로 전환
3. Phase 5 PR을 main에 Squash and merge
4. 최신 main checkout
5. `git pull --ff-only`
6. 아래 브랜치 생성

```text
agent/studylog-phase-6-python-analysis
```

첨부된 이 문서를 프로젝트에 다음 경로로 저장하세요.

```text
docs/PHASE_6_BRIEF.md
```

기존 문서도 먼저 읽으세요.

```text
AGENTS.md
docs/PROJECT_BRIEF.md
docs/PHASE_2_BRIEF.md
docs/PHASE_3_BRIEF.md
docs/PHASE_4_BRIEF.md
docs/PHASE_5_BRIEF.md
```

코드를 바로 작성하지 말고 먼저 기존 CSV 스키마와 Phase 5 구현을 분석한 뒤 구현 계획을 보고하세요.

---

## 2. 이번 Phase에서 구현할 범위

반드시 구현할 기능:

1. Python 패키지 구조
2. 세션 표본 CSV 로딩
3. 세션 요약 CSV 로딩
4. 모델 평가 CSV 로딩
5. UTF-8 BOM 처리
6. 스키마 버전 및 필수 컬럼 검증
7. 데이터 타입 변환과 결측값 처리
8. AI/MOCK/MIXED 세션 구분
9. 세션 시간과 비율 분석
10. 자세 상태 분석
11. 조도 상태 분석
12. Teachable Machine 분류 모델 성능 평가
13. 정확도, precision, recall, F1-score
14. 고정 클래스 순서의 4×4 혼동행렬
15. 참여자·조명·거리 조건별 분석
16. 오분류 쌍 분석
17. 터미널 한국어 요약 출력
18. 텍스트·JSON·CSV 리포트 생성
19. matplotlib 그래프 생성
20. argparse 기반 CLI
21. 클래스 기반 객체 생성과 실행 흐름
22. pytest 단위 테스트
23. 실제 실행법 README
24. 합성 테스트 fixture와 실제 데이터의 명확한 구분

이번 Phase에서 구현하지 않을 기능:

- Python 웹 서버
- Flask, FastAPI, Django
- 브라우저에서 Python 실행
- 웹 앱의 IndexedDB를 Python에서 직접 읽기
- Teachable Machine 재학습
- 최종 v2 모델 교체
- 웹 앱 상태 머신 수정
- PWA 완성
- 실제 그룹 기능
- 로그인·클라우드 DB·API
- 이미지·영상·MediaPipe 원본 랜드마크 분석
- 존재하지 않는 최종 정확도나 통계 생성

---

## 3. Phase 5 CSV 계약

Python 코드는 기존 웹 앱의 CSV 계약을 소비해야 합니다. 웹 CSV 컬럼을 임의로 바꾸지 마세요.

### 3.1 세션 표본 CSV 컬럼

고정 컬럼 순서:

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

### 3.2 세션 요약 CSV 컬럼

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

### 3.3 모델 평가 CSV 컬럼

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

### 3.4 구분자와 인코딩

웹 CSV의 특성:

- UTF-8 BOM 포함 가능
- RFC 4180 escaping
- 배열 값은 `|`로 연결될 수 있음
- ISO 8601 시간
- boolean은 문자열 `true` 또는 `false`로 들어올 수 있음
- 비어 있는 nullable 값 존재 가능

Python 로더는 `utf-8-sig`를 우선 사용해야 합니다.

---

## 4. 가장 중요한 분석 원칙

### 4.1 누적 시간 컬럼을 합산하지 말 것

세션 표본 CSV의 다음 컬럼은 각 행 시점까지의 누적값입니다.

```text
total_session_ms
effective_study_ms
seated_ms
posture_caution_ms
away_ms
lux_caution_ms
checking_ms
```

이 컬럼들을 행 전체에 대해 `sum()` 하면 안 됩니다.

세션 시간 분석의 우선순위:

1. 세션 요약 CSV가 있으면 세션 요약값을 권위 있는 최종값으로 사용
2. 세션 요약이 없으면 해당 session_id의 마지막 유효 표본 또는 최대 누적값을 fallback으로 사용
3. 표본 행의 누적 시간 컬럼을 합산하지 않음

이 원칙을 코드 주석, README, 테스트로 명확히 보장하세요.

### 4.2 중복 가능한 시간

`posture_caution_ms`와 `lux_caution_ms`는 같은 순간에 동시에 증가할 수 있습니다.

따라서 다음을 가정하면 안 됩니다.

```text
posture_caution_ms + lux_caution_ms + effective_study_ms + away_ms
= total_session_ms
```

세부 주의 시간은 서로 중첩될 수 있음을 리포트에 명시하세요.

### 4.3 Mock 기록 기본 제외

기본 분석 대상:

```text
session_kind == AI
```

다음 옵션을 제공하세요.

```text
--include-demo
```

옵션이 없는 경우 `MOCK`, `MIXED` 세션은 집계에서 제외합니다.

제외된 행·세션 수를 터미널과 리포트에 표시하세요.

### 4.4 실제 데이터와 합성 fixture 구분

테스트를 위한 합성 CSV fixture는 허용하지만 다음을 지켜야 합니다.

- 폴더명 또는 파일명에 `synthetic` 또는 `fixture` 명시
- README에 실제 대회 분석 결과가 아님을 표시
- 최종 정확도·통계를 합성 데이터로 주장하지 않음
- 실제 웹 앱에서 내려받은 CSV로 다시 실행할 수 있어야 함

---

## 5. 권장 Python 구조

기존 저장소에 `python/` 폴더가 없다면 아래 구조를 만드세요.

```text
python/
├─ studylog_analysis/
│  ├─ __init__.py
│  ├─ constants.py
│  ├─ errors.py
│  ├─ models.py
│  ├─ schema.py
│  ├─ session_loader.py
│  ├─ evaluation_loader.py
│  ├─ preprocessor.py
│  ├─ session_analyzer.py
│  ├─ lux_analyzer.py
│  ├─ model_evaluator.py
│  ├─ chart_generator.py
│  ├─ report_generator.py
│  ├─ app.py
│  └─ cli.py
│
├─ tests/
│  ├─ fixtures/
│  │  ├─ synthetic-session-samples.csv
│  │  ├─ synthetic-session-summary.csv
│  │  └─ synthetic-evaluation.csv
│  ├─ test_session_loader.py
│  ├─ test_evaluation_loader.py
│  ├─ test_preprocessor.py
│  ├─ test_session_analyzer.py
│  ├─ test_lux_analyzer.py
│  ├─ test_model_evaluator.py
│  ├─ test_chart_generator.py
│  └─ test_cli.py
│
├─ reports/
│  └─ .gitkeep
├─ requirements.txt
├─ requirements-dev.txt
├─ pyproject.toml
└─ README.md
```

기존 저장소 구조와 충돌한다면 이름은 조정할 수 있지만 클래스 책임은 유지하세요.

---

## 6. Python 버전과 의존성

지원 버전:

```text
Python 3.11 이상
```

핵심 라이브러리:

```text
pandas
numpy
scikit-learn
matplotlib
```

개발 도구:

```text
pytest
ruff
```

필요하지 않은 대형 의존성을 추가하지 마세요.

사용 금지:

- seaborn
- Jupyter를 필수 실행 환경으로 만들기
- pickle 모델 로딩
- 외부 API
- 인터넷 다운로드가 필요한 실행 경로

설치한 정확한 버전을 requirements 파일에 고정하세요. 현재 Python 환경과 호환되는 버전을 실제 설치·테스트한 뒤 고정하세요.

---

## 7. 데이터 모델

필요하면 dataclass를 사용해 분석 결과 모델을 정의하세요.

예시:

```python
@dataclass(frozen=True)
class SessionMetrics:
    session_count: int
    total_session_ms: int
    effective_study_ms: int
    seated_ms: int
    posture_caution_ms: int
    away_ms: int
    lux_caution_ms: int
    checking_ms: int
    effective_study_ratio: float | None
    good_posture_ratio: float | None
    recommended_lux_ratio: float | None


@dataclass(frozen=True)
class ModelMetrics:
    record_count: int
    accuracy: float | None
    macro_precision: float | None
    macro_recall: float | None
    macro_f1: float | None
    weighted_f1: float | None
```

분석 결과를 여러 개의 무명 dict만으로 전달하지 말고 타입이 명확한 구조를 사용하세요.

---

## 8. 예외 타입

의미 있는 사용자 오류를 구분하세요.

```python
class StudylogAnalysisError(Exception):
    """studylog 분석 프로그램의 기본 예외."""


class CsvFileNotFoundError(StudylogAnalysisError):
    pass


class CsvSchemaError(StudylogAnalysisError):
    pass


class CsvDataError(StudylogAnalysisError):
    pass


class InsufficientDataError(StudylogAnalysisError):
    pass
```

터미널에 Python traceback 전체를 기본 노출하지 마세요.

개발자 디버그 옵션을 켠 경우에만 상세 traceback을 볼 수 있도록 할 수 있습니다.

CLI 종료 코드:

```text
0: 성공
2: 잘못된 CLI 인자
3: 파일 또는 스키마 오류
4: 분석 가능한 데이터 부족
5: 출력 파일 생성 실패
```

---

## 9. SessionDataLoader 클래스

권장 클래스명:

```python
class SessionDataLoader:
    """세션 표본 및 요약 CSV를 읽고 기본 스키마를 검증한다."""
```

책임:

1. 단일 파일 또는 여러 파일 경로 입력
2. `utf-8-sig`로 CSV 읽기
3. 파일 존재 확인
4. 빈 CSV 확인
5. 필수 컬럼 확인
6. `schema_version == 1` 확인
7. 컬럼명을 정확히 유지
8. 여러 파일 병합
9. 중복 `session_id + sequence` 처리
10. 세션 요약의 중복 `session_id` 처리
11. 로딩 통계 반환

메서드 예시:

```python
def load_samples(self, paths: Sequence[Path]) -> pd.DataFrame:
    ...


def load_summaries(self, paths: Sequence[Path]) -> pd.DataFrame:
    ...
```

중복 처리 정책:

- 완전히 같은 중복 행은 한 개만 유지 가능
- 서로 다른 값의 충돌 중복은 경고 또는 strict 모드 오류
- 조용히 임의 선택하지 않음

---

## 10. EvaluationDataLoader 클래스

```python
class EvaluationDataLoader:
    """모델 평가 CSV를 읽고 평가 스키마를 검증한다."""
```

책임:

1. UTF-8 BOM 처리
2. 필수 컬럼 확인
3. 스키마 버전 확인
4. `evaluation_id` 중복 처리
5. 자세 라벨 검증
6. 참여자 코드 정리
7. model_version 보존
8. 여러 평가 CSV 병합

고정 라벨 순서:

```python
POSE_LABELS = (
    "GOOD_POSTURE",
    "FORWARD_LEAN",
    "SIDE_LEAN",
    "RESTING",
)
```

라벨 순서를 알파벳순으로 자동 정렬하지 마세요.

---

## 11. DataPreprocessor 클래스

```python
class DataPreprocessor:
    """CSV의 문자열 값을 분석 가능한 타입으로 변환하고 품질 이슈를 기록한다."""
```

처리할 항목:

### 11.1 boolean

다음 문자열을 안전하게 변환:

```text
true / false
True / False
1 / 0
```

해석할 수 없는 값은 strict 모드에서 오류, lenient 모드에서 결측 처리 후 카운트합니다.

### 11.2 숫자

- 음수일 수 없는 duration 값 검증
- 확률은 0~1 범위 검증
- Lux는 음수 불가
- `goal_minutes` 음수 불가
- `valid_sample_count`, `rejected_sample_count` 음수 불가

### 11.3 시간

- ISO 8601 파싱
- timezone 정보 보존
- 파싱 실패 개수 보고
- 세션 내 timestamp 순서 검사

### 11.4 배열

다음 값은 `|`로 분리 가능:

```text
control_modes_used
model_versions
deviation_reasons
```

빈 문자열은 빈 리스트로 처리하세요.

### 11.5 nullable

빈 문자열을 무조건 0으로 바꾸지 마세요.

예:

```text
tm_confidence 빈 값 → NaN
deviation_score 빈 값 → NaN
average_lux 빈 값 → NaN
```

### 11.6 품질 리포트

전처리 결과에 다음 통계를 포함하세요.

- 입력 행 수
- 사용 행 수
- 제거된 중복 행 수
- 잘못된 행 수
- 결측값 수
- 제외된 MOCK/MIXED 세션 수
- 알 수 없는 라벨 수

---

## 12. SessionAnalyzer 클래스

```python
class SessionAnalyzer:
    """세션 시간, 자세 상태, 과목별·세션별 지표를 계산한다."""
```

### 12.1 최종 duration 결정

세션별 최종 duration 우선순위:

1. summary CSV의 값
2. sample CSV 마지막 유효 행
3. sample CSV 각 누적 컬럼의 max

누적 시간 컬럼을 행 단위로 합산하지 마세요.

### 12.2 계산할 지표

- 분석 대상 세션 수
- 완료 세션 수
- 중단 세션 수
- 전체 세션 시간
- 순공 시간
- 착석 시간
- 자세 주의 시간
- 자리 비움 시간
- 조도 주의 시간
- 확인 중 시간
- 순공 비율
- 기준 자세 유지율
- 적정 조도 유지율
- 목표 달성률
- 과목별 순공 시간
- 세션별 순공 시간
- AI/MOCK/MIXED 세션 수

### 12.3 상태 분포

표본 CSV에서 다음을 분석하세요.

```text
stable_posture_state
study_status
raw_posture_state
bad_posture_reason
blocking_reason
```

표본은 약 1초 간격이지만 정확히 1초라고 무조건 가정하지 마세요.

가능하면 인접 timestamp 또는 elapsed_ms 차이를 이용해 각 상태의 지속시간을 추정하고, 비정상적으로 큰 간격은 설정된 상한으로 제한하세요.

단, 최종 세션 duration은 summary/누적값이 권위 있는 값입니다.

### 12.4 데이터 부족

한 세션만 있거나 표본이 매우 적어도 오류로 종료하지 말고 분석 가능한 범위만 출력하세요.

통계적으로 대표성이 부족하면 다음 경고를 리포트에 넣으세요.

```text
현재 데이터 수가 적어 결과를 일반화하기 어렵습니다.
```

---

## 13. LuxAnalyzer 클래스

```python
class LuxAnalyzer:
    """조도 수치와 조도 상태의 분포 및 시간 흐름을 분석한다."""
```

계산 항목:

- 평균 Lux
- 중앙값 Lux
- 최소 Lux
- 최대 Lux
- 표준편차
- Lux 상태별 표본 비율
- 적정 조도 비율
- DARK/DIM/BRIGHT/TOO_BRIGHT 발생 횟수
- 가장 긴 비권장 조도 연속 구간
- 세션별 평균 Lux
- 과목별 평균 Lux

고정 Lux 상태:

```text
DARK
DIM
RECOMMENDED
BRIGHT
TOO_BRIGHT
```

실제 센서가 아니라 가상 센서 시뮬레이션 데이터임을 텍스트 리포트에 명시하세요.

조도와 자세 또는 집중 사이의 인과관계를 주장하지 마세요.

허용되는 표현:

```text
두 상태가 같은 구간에서 함께 관찰되었다.
```

금지되는 표현:

```text
낮은 조도가 자세 불량을 유발했다.
```

---

## 14. ModelEvaluator 클래스

```python
class ModelEvaluator:
    """Teachable Machine Pose 평가 기록으로 분류 성능을 계산한다."""
```

고정 클래스 순서:

```text
GOOD_POSTURE
FORWARD_LEAN
SIDE_LEAN
RESTING
```

계산 항목:

### 전체 지표

- 평가 레코드 수
- 전체 정확도
- macro precision
- macro recall
- macro F1
- weighted F1

### 클래스별 지표

- precision
- recall
- F1-score
- support
- 클래스별 정확도 또는 recall
- 평균 confidence

### 혼동행렬

- 항상 4×4 배열
- 특정 클래스 표본이 없어도 행·열 유지
- 실제 라벨을 행
- 예측 라벨을 열

### 조건별 지표

- participant_code별 정확도
- lighting_condition별 정확도
- camera_distance별 정확도
- model_version별 정확도
- mirror_camera별 정확도

### 신뢰도 분석

- 정답 표본 평균 confidence
- 오답 표본 평균 confidence
- confidence 구간별 정확도
- 낮은 confidence 오답 목록
- 높은 confidence 오답 목록

### 오분류 쌍

예:

```text
GOOD_POSTURE → SIDE_LEAN
FORWARD_LEAN → GOOD_POSTURE
```

빈도가 높은 순으로 집계하세요.

### zero division

특정 클래스 데이터가 없을 때 경고를 무시하고 0 또는 null을 명확히 처리하세요.

scikit-learn의 `zero_division=0`을 사용할 수 있습니다.

### 데이터 부족 경고

다음 상황에서 경고를 출력하세요.

- 총 평가 수가 20개 미만
- 특정 클래스 support가 5개 미만
- 참여자가 1명뿐임
- model_version이 섞여 있음

데이터가 적더라도 값을 조작하거나 보정하지 마세요.

---

## 15. ChartGenerator 클래스

```python
class ChartGenerator:
    """분석 결과를 matplotlib 이미지 파일로 생성한다."""
```

matplotlib만 사용하세요. seaborn은 사용하지 마세요.

생성할 그래프:

```text
session_duration_breakdown.png
study_status_timeline.png
lux_timeline.png
posture_state_distribution.png
confusion_matrix.png
class_metrics.png
accuracy_by_participant.png
accuracy_by_lighting.png
confidence_correct_vs_incorrect.png
```

입력 데이터가 부족한 그래프는 빈 그래프를 억지로 생성하지 말고 다음 중 하나를 선택하세요.

- 생성 생략 후 리포트에 사유 기록
- `Insufficient data`가 명확히 표시된 간단한 그래프 생성

크로스플랫폼 폰트 문제를 줄이기 위해 그래프의 제목과 축 라벨은 영어를 사용해도 됩니다. 터미널 및 텍스트 리포트는 한국어로 작성하세요.

그래프 요구사항:

- 각 파일은 독립된 figure
- subplot 사용 최소화
- `plt.close()` 호출
- headless 환경에서 실행 가능
- Agg backend 사용 가능
- 150 DPI 이상
- 축 범위와 단위 명시
- confusion matrix 셀 숫자 표시
- 클래스 순서 고정

---

## 16. ReportGenerator 클래스

```python
class ReportGenerator:
    """분석 결과를 터미널, 텍스트, JSON, CSV 파일로 내보낸다."""
```

생성 파일:

```text
summary.txt
summary.json
session_metrics.csv
class_metrics.csv
participant_metrics.csv
lighting_metrics.csv
misclassification_pairs.csv
data_quality.json
```

### summary.txt

한국어로 읽기 쉽게 작성하세요.

예시 형식:

```text
[studylog 분석 결과]

데이터
- 세션: 3개
- 평가 기록: 180개
- 제외된 데모 세션: 2개

학습 세션
- 전체 세션 시간: 02:30:00
- 순공 시간: 01:48:12
- 순공 비율: 72.1%
- 기준 자세 유지율: 81.4%
- 적정 조도 유지율: 87.2%

자세 모델
- 전체 정확도: 86.7%
- Macro F1: 85.9%
- 가장 많이 혼동된 자세: GOOD_POSTURE → SIDE_LEAN

주의
- 평가 데이터가 적어 결과를 일반화하기 어렵습니다.
- 조도값은 가상 센서 시뮬레이션 데이터입니다.
```

실제 값이 없으면 `N/A`로 표시하세요. 0으로 위장하지 마세요.

### summary.json

숫자 값을 포맷된 문자열이 아니라 원시 number 또는 null로 저장하세요.

예:

```json
{
  "session": {
    "count": 3,
    "total_session_ms": 9000000,
    "effective_study_ratio": 0.721
  },
  "model": {
    "record_count": 180,
    "accuracy": 0.867,
    "macro_f1": 0.859
  },
  "warnings": []
}
```

---

## 17. StudylogAnalysisApp 클래스

전체 프로그램 흐름을 관리하는 클래스를 구현하세요.

```python
class StudylogAnalysisApp:
    """로더, 전처리기, 분석기, 차트, 리포트를 조합해 실행한다."""
```

책임:

1. CLI 옵션 수신
2. 필요한 클래스 객체 생성
3. CSV 로딩
4. 전처리
5. 세션 분석
6. 조도 분석
7. 모델 평가
8. 차트 생성
9. 리포트 생성
10. 터미널 요약
11. 종료 코드 반환

실제 객체 생성 흐름이 코드에 명확히 보여야 합니다.

예시:

```python
app = StudylogAnalysisApp(
    session_loader=SessionDataLoader(...),
    evaluation_loader=EvaluationDataLoader(...),
    preprocessor=DataPreprocessor(...),
    session_analyzer=SessionAnalyzer(...),
    lux_analyzer=LuxAnalyzer(...),
    model_evaluator=ModelEvaluator(...),
    chart_generator=ChartGenerator(...),
    report_generator=ReportGenerator(...),
)

return app.run(config)
```

클래스 이름만 만들고 실제로 사용하지 않는 구조는 허용하지 않습니다.

---

## 18. CLI

`argparse`를 사용하세요.

기본 실행 예시:

```bash
python -m studylog_analysis.cli --samples ../data/session-samples.csv --summary ../data/session-summary.csv --evaluation ../data/evaluation.csv --output ../reports
```

지원 옵션:

```text
--samples PATH [PATH ...]
--summary PATH [PATH ...]
--evaluation PATH [PATH ...]
--output PATH
--include-demo
--strict
--no-charts
--session-id SESSION_ID
--model-version MODEL_VERSION
--debug
```

요구사항:

- 세션 CSV만 있어도 세션 분석 가능
- 평가 CSV만 있어도 모델 평가 가능
- 둘 다 없으면 명확한 오류
- 출력 디렉터리 자동 생성
- 기존 파일 덮어쓰기 정책 명시
- Windows PowerShell과 macOS/Linux 명령 예시 제공

CLI 시작 시 입력 파일과 설정을 한 번 요약 출력하세요.

---

## 19. 터미널 출력

터미널 결과는 코드 실행 증빙으로 사용하기 쉬운 형태로 구성하세요.

예시:

```text
studylog Python 분석을 시작합니다.

[입력]
세션 표본 CSV: 1개
세션 요약 CSV: 1개
평가 CSV: 1개
데모 기록 포함: 아니오

[데이터 품질]
세션 표본: 312행
평가 기록: 180행
중복 제거: 0행
잘못된 행: 0행

[세션 분석]
전체 세션: 60분 00초
순공 시간: 42분 31초
기준 자세 유지율: 81.4%
적정 조도 유지율: 87.2%

[모델 평가]
전체 정확도: 86.7%
Macro F1: 85.9%
최다 오분류: GOOD_POSTURE → SIDE_LEAN

[생성 파일]
reports/summary.txt
reports/summary.json
reports/confusion_matrix.png
reports/lux_timeline.png

분석이 완료되었습니다.
```

로그가 너무 장황하지 않도록 하고 핵심 결과가 한 화면에 들어오게 하세요.

---

## 20. 데이터 활용 결과

분석 프로그램은 결과를 계산하는 데서 끝나지 않고, 설정 개선에 활용할 수 있는 제안 데이터를 출력해야 합니다.

단, 자동으로 웹 앱 설정을 수정하지는 않습니다.

제안 예시:

```text
- GOOD_POSTURE와 SIDE_LEAN 혼동이 많으므로 두 클래스의 데이터 보강 권장
- DIM 조건에서 정확도가 상대적으로 낮으므로 어두운 환경 데이터 추가 권장
- confidence 0.60 미만 구간의 정확도가 낮으므로 최소 신뢰도 조정 검토
- 특정 참여자의 정확도가 낮으므로 새로운 사람 데이터 추가 권장
```

제안은 실제 데이터로 확인된 경우에만 생성하세요.

근거가 부족하면 다음처럼 출력하세요.

```text
현재 데이터만으로 임계값 변경을 권장하기 어렵습니다.
```

의료적·인과적 제안은 하지 마세요.

---

## 21. 테스트

pytest를 사용하세요.

최소 테스트 범위:

### SessionDataLoader

1. UTF-8 BOM CSV 읽기
2. 필수 컬럼 누락 오류
3. 존재하지 않는 파일 오류
4. schema_version 오류
5. 동일 중복 제거
6. 충돌 중복 처리

### EvaluationDataLoader

1. 정상 평가 CSV 읽기
2. 잘못된 클래스 라벨 오류
3. 여러 파일 병합
4. evaluation_id 중복 처리

### DataPreprocessor

1. boolean 문자열 변환
2. 숫자 변환
3. 확률 범위 검증
4. Lux 음수 처리
5. ISO 시간 파싱
6. `|` 배열 파싱
7. nullable 값 보존

### SessionAnalyzer

1. summary 우선 사용
2. summary 없을 때 마지막 sample fallback
3. 누적 duration을 sum하지 않음
4. AI 세션 기본 포함
5. MOCK/MIXED 기본 제외
6. include-demo 옵션
7. 자세·조도 시간 중첩 안전 처리
8. 적은 데이터 처리

### LuxAnalyzer

1. 평균·최소·최대 계산
2. 상태 분포
3. 비권장 연속 구간
4. 빈 데이터 처리

### ModelEvaluator

1. 정확도 계산
2. 고정 4×4 혼동행렬
3. 한 클래스가 없어도 행·열 유지
4. precision/recall/F1
5. 참여자별 정확도
6. 조명별 정확도
7. 오분류 쌍
8. zero division 처리
9. 데이터 부족 경고

### ChartGenerator

1. 출력 디렉터리 생성
2. 파일 생성
3. 빈 데이터에서 안전 처리
4. figure close 확인

### CLI

1. 정상 실행 종료 코드 0
2. 입력 없음 오류
3. 잘못된 스키마 종료 코드
4. `--no-charts`
5. `--include-demo`

최소 30개 이상의 의미 있는 Python 테스트를 목표로 하세요.

합성 fixture의 수치는 최종 프로젝트 성능으로 사용하지 않습니다.

---

## 22. 코드 품질

필수 요구사항:

- 모든 public 클래스와 메서드에 docstring
- 타입 힌트
- pathlib 사용
- 책임 분리
- 순수 계산 함수 우선
- 전역 mutable 상태 금지
- broad `except Exception` 남용 금지
- 파일 핸들 안전하게 닫기
- 입력 CSV 원본 수정 금지
- 랜덤 결과 금지
- 외부 네트워크 접근 금지
- OS별 절대 경로 하드코딩 금지
- OneDrive 경로 하드코딩 금지

Ruff 설정을 `pyproject.toml`에 추가하세요.

실행 검증:

```bash
python -m ruff check .
python -m pytest
python -m compileall studylog_analysis
```

가능하면 다음도 수행하세요.

```bash
python -m studylog_analysis.cli --samples tests/fixtures/synthetic-session-samples.csv --summary tests/fixtures/synthetic-session-summary.csv --evaluation tests/fixtures/synthetic-evaluation.csv --output reports/synthetic-demo
```

해당 결과는 반드시 `synthetic-demo`라고 표시하세요.

---

## 23. README

`python/README.md`에 다음 내용을 포함하세요.

1. Python 모듈의 역할
2. 웹 앱과의 연결 구조
3. Python 3.11 이상 요구
4. 가상환경 생성법
5. 설치법
6. 웹 앱에서 CSV 다운로드하는 법
7. CLI 실행법
8. 각 CSV의 역할
9. 생성되는 리포트
10. AI/MOCK/MIXED 필터 설명
11. 누적 duration을 합산하지 않는 이유
12. 합성 fixture와 실제 데이터 차이
13. 개인정보 보호
14. 문제 해결법
15. 테스트 실행법

Windows PowerShell 예시:

```powershell
cd python
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m pip install -r requirements-dev.txt
python -m studylog_analysis.cli --samples ..\data\session-samples.csv --summary ..\data\session-summary.csv --evaluation ..\data\evaluation.csv --output ..\reports
```

macOS/Linux 예시도 작성하세요.

---

## 24. 루트 README 및 AGENTS.md 갱신

루트 README에 Phase 6 섹션을 추가하세요.

포함 내용:

- Python 분석 모듈 위치
- 실행 요약
- 웹 CSV → Python 분석 흐름
- 생성되는 주요 파일
- 실제 CSV가 필요하다는 안내

AGENTS.md에 Phase 6 데이터 경계를 짧게 추가하세요.

예:

```text
- Python 분석은 웹 앱이 내보낸 schema_version 1 CSV를 소비한다.
- 누적 duration 컬럼을 행 단위로 합산하지 않는다.
- 합성 fixture 결과를 실제 모델 성능으로 주장하지 않는다.
- Phase 6에서 웹 런타임, 모델, 상태 머신을 수정하지 않는다.
```

AGENTS.md를 지나치게 길게 만들지 마세요.

---

## 25. 웹 앱 회귀 방지

Phase 6은 주로 `python/`과 문서를 추가하는 작업입니다.

기존 React·TypeScript 앱을 불필요하게 수정하지 마세요.

반드시 기존 검증도 다시 수행하세요.

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Python 작업 때문에 웹 빌드가 깨지면 안 됩니다.

npm audit의 기존 취약점을 이번 Phase에서 `--force`로 자동 수정하지 마세요. 별도 보고만 하세요.

---

## 26. 실제 데이터 실행 준비

Codex가 최종 실제 데이터가 없는 상태에서 임의의 실제 성능을 만들지 마세요.

Phase 6 완료 시 다음 두 실행 상태를 구분해 보고하세요.

### A. 합성 fixture 검증

- 코드와 테스트가 정상 작동하는지 검증
- 출력에 synthetic 표시
- 최종 성능 주장 금지

### B. 실제 CSV 검증

실제 Phase 5 웹 앱에서 내려받은 CSV가 작업 환경에 제공된 경우에만 실행하세요.

실제 파일이 제공되지 않았다면 다음을 완료 보고에 명확히 적으세요.

```text
실제 모델 평가 지표는 아직 계산하지 않았습니다.
사용자가 웹 앱에서 실제 평가 CSV를 내려받아 CLI를 실행해야 합니다.
```

---

## 27. Phase 6 완료 기준

다음 조건을 모두 만족해야 합니다.

1. Phase 5 PR이 main에 병합됨
2. Phase 6 전용 브랜치 생성
3. `docs/PHASE_6_BRIEF.md` 저장
4. Python 3.11 이상에서 실행 가능
5. Python 클래스 3개 이상 실제 정의
6. 최소 8개 주요 클래스가 실제 실행 흐름에 사용됨
7. 세션 표본 CSV 로딩
8. 세션 요약 CSV 로딩
9. 평가 CSV 로딩
10. UTF-8 BOM 처리
11. 스키마 검증
12. 누적 duration 미합산 보장
13. AI 세션 기본 분석
14. MOCK/MIXED 기본 제외
15. 세션 분석
16. Lux 분석
17. 모델 정확도 분석
18. 4×4 혼동행렬
19. 클래스별 precision/recall/F1
20. 참여자·조명·거리 분석
21. 오분류 분석
22. 터미널 한국어 요약
23. summary.txt 생성
24. summary.json 생성
25. 분석 CSV 생성
26. matplotlib 그래프 생성
27. CLI 구현
28. 최소 30개 Python 테스트 통과
29. Ruff 통과
30. compileall 통과
31. 합성 fixture 실행 성공
32. 실제 데이터가 없으면 실제 지표를 만들지 않음
33. 기존 npm lint 통과
34. 기존 npm typecheck 통과
35. 기존 npm test 통과
36. 기존 npm build 통과
37. Python README 작성
38. 루트 README 갱신
39. 원본 영상·이미지 처리 없음
40. Phase 7 미착수

---

## 28. 완료 보고 형식

Phase 6 완료 후 다음 형식으로 보고하세요.

```text
## Git/PR 상태

## 구현한 Python 클래스

## 프로젝트 구조

## 지원 CSV 스키마

## 데이터 전처리 방식

## 세션 분석 방식

## Lux 분석 방식

## 모델 평가 방식

## 생성되는 리포트·그래프

## CLI 실행 예시

## Python 검증 결과
- ruff
- pytest
- compileall
- synthetic fixture 실행

## 기존 웹 검증 결과
- npm lint
- npm typecheck
- npm test
- npm build

## 실제 CSV 분석 여부

## 알려진 제한

## Phase 7 전에 필요한 작업
```

Phase 7인 최종 모델 교체, 실제 데이터 수집, 임계값 튜닝, 최종 QA는 임의로 시작하지 말고 Phase 6 완료 보고 후 멈추세요.

---

## 29. 지금 시작할 작업

코드를 작성하기 전에 먼저 다음을 보고하세요.

1. 현재 Git 브랜치와 Phase 5 PR 상태
2. Phase 5 CSV 스키마 실제 확인 결과
3. Phase 5 CsvExporter의 인코딩·배열 형식 확인 결과
4. Python 패키지 구조 계획
5. 구현할 클래스와 책임
6. 누적 duration 처리 방식
7. AI/MOCK/MIXED 필터 방식
8. 모델 평가 지표
9. 생성할 그래프와 리포트
10. 설치할 Python 패키지와 버전 결정 방식
11. 테스트 계획
12. 실제 데이터가 없을 때의 처리
13. Phase 6 완료 기준

계획을 먼저 제시한 뒤 구현하세요.
