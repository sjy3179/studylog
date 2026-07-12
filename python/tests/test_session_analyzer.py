from pathlib import Path

from studylog_analysis.preprocessor import DataPreprocessor
from studylog_analysis.session_analyzer import SessionAnalyzer
from studylog_analysis.session_loader import SessionDataLoader


def test_summary_is_authoritative_and_demo_is_excluded(fixtures: Path) -> None:
    loader = SessionDataLoader()
    samples, _ = DataPreprocessor().process(loader.load_samples([fixtures / "synthetic-session-samples.csv"]))
    summaries, _ = DataPreprocessor().process(loader.load_summaries([fixtures / "synthetic-session-summary.csv"]))
    metrics, excluded, _ = SessionAnalyzer().analyze(samples, summaries)
    assert metrics is not None
    assert metrics.session_count == 1
    assert metrics.durations["total_session_ms"] == 2000
    assert excluded == 1


def test_cumulative_sample_rows_are_not_summed(fixtures: Path) -> None:
    samples, _ = DataPreprocessor().process(
        SessionDataLoader().load_samples([fixtures / "synthetic-session-samples.csv"])
    )
    metrics, _, _ = SessionAnalyzer().analyze(samples, samples.iloc[0:0])
    assert metrics is not None
    assert metrics.durations["total_session_ms"] == 2000
