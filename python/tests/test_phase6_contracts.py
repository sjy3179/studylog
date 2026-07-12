from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd
import pytest

from studylog_analysis.app import StudylogAnalysisApp
from studylog_analysis.chart_generator import ChartGenerator
from studylog_analysis.cli import main
from studylog_analysis.errors import CsvDataError, CsvFileNotFoundError, CsvSchemaError
from studylog_analysis.evaluation_loader import EvaluationDataLoader
from studylog_analysis.lux_analyzer import LuxAnalyzer
from studylog_analysis.model_evaluator import ModelEvaluator
from studylog_analysis.models import AnalysisResult, DataQuality
from studylog_analysis.preprocessor import DataPreprocessor
from studylog_analysis.session_analyzer import SessionAnalyzer
from studylog_analysis.session_loader import SessionDataLoader


def _samples(fixtures: Path) -> pd.DataFrame:
    raw = SessionDataLoader().load_samples([fixtures / "synthetic-session-samples.csv"])
    return DataPreprocessor().process(raw)[0]


def _summaries(fixtures: Path) -> pd.DataFrame:
    raw = SessionDataLoader().load_summaries([fixtures / "synthetic-session-summary.csv"])
    return DataPreprocessor().process(raw)[0]


def _evaluations(fixtures: Path) -> pd.DataFrame:
    raw = EvaluationDataLoader().load([fixtures / "synthetic-evaluation.csv"])
    return DataPreprocessor().process(raw)[0]


def test_missing_sample_file_is_reported(tmp_path: Path) -> None:
    with pytest.raises(CsvFileNotFoundError):
        SessionDataLoader().load_samples([tmp_path / "missing.csv"])


def test_wrong_schema_version_is_rejected(fixtures: Path, tmp_path: Path) -> None:
    frame = pd.read_csv(fixtures / "synthetic-session-samples.csv")
    frame["schema_version"] = 99
    path = tmp_path / "wrong-version.csv"
    frame.to_csv(path, index=False, encoding="utf-8-sig")
    with pytest.raises(CsvSchemaError):
        SessionDataLoader().load_samples([path])


def test_strict_sample_loader_rejects_conflicting_keys(fixtures: Path, tmp_path: Path) -> None:
    frame = pd.read_csv(fixtures / "synthetic-session-samples.csv")
    conflict = frame.iloc[[0]].copy()
    conflict["lux"] = 999
    path = tmp_path / "duplicate.csv"
    pd.concat([frame, conflict]).to_csv(path, index=False)
    with pytest.raises(CsvDataError):
        SessionDataLoader(strict=True).load_samples([path])


def test_evaluation_loader_merges_files_and_deduplicates(fixtures: Path) -> None:
    path = fixtures / "synthetic-evaluation.csv"
    result = EvaluationDataLoader().load([path, path])
    assert len(result) == 4


def test_evaluation_loader_rejects_unknown_label(fixtures: Path, tmp_path: Path) -> None:
    frame = pd.read_csv(fixtures / "synthetic-evaluation.csv")
    frame.loc[0, "actual_label"] = "AWAY"
    path = tmp_path / "unknown-label.csv"
    frame.to_csv(path, index=False)
    with pytest.raises(CsvDataError):
        EvaluationDataLoader().load([path])


def test_preprocessor_rejects_probability_outside_range() -> None:
    frame = pd.DataFrame({"average_confidence": ["1.4"]})
    result, quality = DataPreprocessor().process(frame)
    assert pd.isna(result.loc[0, "average_confidence"])
    assert quality.invalid_rows == 1


def test_preprocessor_treats_negative_lux_as_missing() -> None:
    result, quality = DataPreprocessor().process(pd.DataFrame({"lux": ["-1"]}))
    assert pd.isna(result.loc[0, "lux"])
    assert quality.invalid_rows == 1


def test_preprocessor_parses_boolean_variants() -> None:
    result, _ = DataPreprocessor().process(pd.DataFrame({"runtime_ready": ["true", "0", ""]}))
    assert result["runtime_ready"].tolist()[:2] == [True, False]
    assert result["runtime_ready"].iloc[2] is None


def test_preprocessor_parses_iso_timestamp() -> None:
    result, _ = DataPreprocessor().process(pd.DataFrame({"timestamp_iso": ["2026-01-01T00:00:00Z"]}))
    assert isinstance(result["timestamp_iso"].dtype, pd.DatetimeTZDtype)


def test_preprocessor_parses_pipe_delimited_arrays() -> None:
    result, _ = DataPreprocessor().process(pd.DataFrame({"deviation_reasons": ["HEAD|SHOULDER", ""]}))
    assert result["deviation_reasons"].tolist() == [["HEAD", "SHOULDER"], []]


def test_session_analyzer_can_include_demo_sessions(fixtures: Path) -> None:
    metrics, excluded, _ = SessionAnalyzer().analyze(_samples(fixtures), _summaries(fixtures), include_demo=True)
    assert metrics is not None
    assert metrics.session_count == 2
    assert excluded == 0


def test_session_analyzer_filters_by_session_id(fixtures: Path) -> None:
    samples = _samples(fixtures)
    session_id = str(samples.iloc[0]["session_id"])
    metrics, _, finals = SessionAnalyzer().analyze(samples, _summaries(fixtures), True, session_id)
    assert metrics is not None
    assert finals["session_id"].astype(str).eq(session_id).all()


def test_session_analyzer_allows_overlapping_caution_durations(fixtures: Path) -> None:
    summary = _summaries(fixtures).iloc[[0]].copy()
    summary["posture_caution_ms"] = 1_500
    summary["lux_caution_ms"] = 1_500
    metrics, _, _ = SessionAnalyzer().analyze(_samples(fixtures), summary)
    assert metrics is not None
    assert metrics.durations["posture_caution_ms"] + metrics.durations["lux_caution_ms"] > 2_000


def test_session_analyzer_uses_maximum_for_missing_last_value(fixtures: Path) -> None:
    samples = _samples(fixtures)
    ai = samples[samples["session_kind"] == "AI"].copy()
    ai.loc[ai.index[-1], "effective_study_ms"] = pd.NA
    metrics, _, _ = SessionAnalyzer().analyze(ai, ai.iloc[0:0])
    assert metrics is not None
    assert metrics.durations["effective_study_ms"] == 1_000


def test_lux_analyzer_returns_none_for_empty_data() -> None:
    assert LuxAnalyzer().analyze(pd.DataFrame()) is None


def test_lux_analyzer_tracks_longest_warning_streak(fixtures: Path) -> None:
    samples = _samples(fixtures)
    samples["lux_status"] = "LOW"
    metrics = LuxAnalyzer().analyze(samples)
    assert metrics is not None
    assert metrics.longest_non_recommended_ms == 1_000


def test_lux_streak_does_not_cross_session_boundary() -> None:
    frame = pd.DataFrame(
        {
            "session_id": ["a", "a", "b", "b"],
            "elapsed_ms": [0, 1_000, 0, 1_000],
            "lux": [100, 100, 100, 100],
            "lux_status": ["LOW", "LOW", "LOW", "LOW"],
        }
    )
    metrics = LuxAnalyzer().analyze(frame)
    assert metrics is not None
    assert metrics.longest_non_recommended_ms == 1_000


def test_model_evaluator_returns_none_for_empty_records() -> None:
    assert ModelEvaluator().evaluate(pd.DataFrame()) is None


def test_model_evaluator_filters_model_version(fixtures: Path) -> None:
    records = _evaluations(fixtures)
    assert ModelEvaluator().evaluate(records, "missing") is None


def test_model_evaluator_builds_conditional_metrics(fixtures: Path) -> None:
    metrics = ModelEvaluator().evaluate(_evaluations(fixtures))
    assert metrics is not None
    assert metrics.participant_metrics
    assert metrics.lighting_metrics
    assert metrics.distance_metrics
    assert metrics.model_version_metrics
    assert metrics.mirror_metrics


def test_model_evaluator_builds_confidence_analysis(fixtures: Path) -> None:
    metrics = ModelEvaluator().evaluate(_evaluations(fixtures))
    assert metrics is not None
    assert metrics.correct_average_confidence is not None
    assert metrics.incorrect_average_confidence is not None
    assert len(metrics.confidence_bins) == 3


def test_model_evaluator_warns_on_small_dataset(fixtures: Path) -> None:
    metrics = ModelEvaluator().evaluate(_evaluations(fixtures))
    assert metrics is not None
    assert any("20개" in warning for warning in metrics.warnings)


def test_chart_generator_handles_empty_data(tmp_path: Path) -> None:
    result = AnalysisResult(None, None, None, DataQuality(), [])
    created = ChartGenerator().generate(result, pd.DataFrame(), pd.DataFrame(), tmp_path)
    assert created == []
    assert tmp_path.is_dir()


def test_chart_generator_closes_figures(fixtures: Path, tmp_path: Path) -> None:
    StudylogAnalysisApp().run(
        [fixtures / "synthetic-session-samples.csv"],
        [fixtures / "synthetic-session-summary.csv"],
        [fixtures / "synthetic-evaluation.csv"],
        tmp_path,
    )
    assert plt.get_fignums() == []


def test_cli_requires_at_least_one_input() -> None:
    with pytest.raises(SystemExit) as error:
        main([])
    assert error.value.code == 2


def test_cli_returns_input_error_for_bad_schema(tmp_path: Path) -> None:
    path = tmp_path / "bad.csv"
    pd.DataFrame({"schema_version": [1]}).to_csv(path, index=False)
    assert main(["--samples", str(path), "--output", str(tmp_path / "out")]) == 3


def test_cli_include_demo_reports_two_sessions(fixtures: Path, tmp_path: Path) -> None:
    output = tmp_path / "reports"
    code = main(
        [
            "--samples",
            str(fixtures / "synthetic-session-samples.csv"),
            "--summary",
            str(fixtures / "synthetic-session-summary.csv"),
            "--output",
            str(output),
            "--include-demo",
            "--no-charts",
        ]
    )
    payload = pd.read_json(output / "summary.json", typ="series")
    assert code == 0
    assert payload["session"]["session_count"] == 2
