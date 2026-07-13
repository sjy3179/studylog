from pathlib import Path

from studylog_analysis.preprocessor import DataPreprocessor
from studylog_analysis.session_loader import SessionDataLoader


def test_preprocessor_converts_types_and_preserves_missing(fixtures: Path) -> None:
    raw = SessionDataLoader().load_samples([fixtures / "synthetic-session-samples.csv"])
    frame, quality = DataPreprocessor().process(raw)
    assert frame["runtime_ready"].dtype == bool
    assert frame["tm_confidence"].iloc[0] == 0.9
    assert quality.input_rows == 3
