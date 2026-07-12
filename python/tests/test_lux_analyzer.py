from pathlib import Path

from studylog_analysis.lux_analyzer import LuxAnalyzer
from studylog_analysis.preprocessor import DataPreprocessor
from studylog_analysis.session_loader import SessionDataLoader


def test_lux_statistics(fixtures: Path) -> None:
    samples, _ = DataPreprocessor().process(
        SessionDataLoader().load_samples([fixtures / "synthetic-session-samples.csv"])
    )
    metrics = LuxAnalyzer().analyze(samples[samples["session_kind"] == "AI"])
    assert metrics is not None
    assert metrics.mean == 410
    assert metrics.state_ratios["RECOMMENDED"] == 0.5
