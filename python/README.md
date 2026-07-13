# studylog Python 분석

Phase 5 웹 앱에서 다운로드한 CSV를 오프라인으로 분석하는 Python 3.11+ 프로그램입니다. 웹 서버를 실행하거나 IndexedDB에 직접 접근하지 않습니다.

## 설치

```powershell
cd python
python -m pip install -r requirements-dev.txt
```

macOS/Linux도 같은 명령을 사용합니다. 가상환경 사용을 권장합니다.

## 실행

```powershell
python -m studylog_analysis.cli `
  --samples ../data/studylog-session-samples.csv `
  --summary ../data/studylog-session-summary.csv `
  --evaluation ../data/studylog-model-evaluation.csv `
  --output reports
```

```bash
python -m studylog_analysis.cli \
  --samples ../data/studylog-session-samples.csv \
  --summary ../data/studylog-session-summary.csv \
  --evaluation ../data/studylog-model-evaluation.csv \
  --output reports
```

옵션: `--include-demo`, `--strict`, `--no-charts`, `--session-id`, `--model-version`, `--debug`.

기본 분석은 AI 세션만 포함합니다. `--include-demo`를 지정할 때만 MOCK/MIXED를 포함합니다. 출력 디렉터리의 같은 이름 파일은 최신 분석 결과로 덮어씁니다.

## 누적 duration 규칙

세션 표본의 `total_session_ms`, `effective_study_ms`, `seated_ms`, `posture_caution_ms`, `away_ms`, `lux_caution_ms`, `checking_ms`는 누적값입니다. 행별 합계를 계산하지 않습니다. 요약 CSV를 우선하고, 없으면 마지막 유효 표본, 이후 각 누적 컬럼의 최대값을 사용합니다. 자세 주의와 조도 주의 시간은 서로 겹칠 수 있습니다.

## 출력

`summary.txt`, `summary.json`, 분석 CSV 6종, `data_quality.json`, 그리고 데이터가 충분한 그래프 PNG를 생성합니다. 조도 데이터는 가상 센서 시뮬레이션이며 자세나 집중과의 인과관계를 주장하지 않습니다.

`tests/fixtures/synthetic-*.csv`는 프로그램 테스트를 위한 합성 데이터이며 실제 모델 성능이나 실제 사용자 분석 결과가 아닙니다. 실제 지표는 웹 앱에서 내려받은 CSV로 다시 실행해야 합니다.
