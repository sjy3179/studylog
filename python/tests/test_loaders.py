from pathlib import Path

import pandas as pd
import pytest

from studylog_analysis.errors import CsvSchemaError
from studylog_analysis.evaluation_loader import EvaluationDataLoader
from studylog_analysis.session_loader import SessionDataLoader


def test_loaders_handle_bom_and_fixed_schema(fixtures: Path) -> None:
    samples = SessionDataLoader().load_samples([fixtures / "synthetic-session-samples.csv"])
    evaluations = EvaluationDataLoader().load([fixtures / "synthetic-evaluation.csv"])
    assert len(samples) == 3
    assert evaluations["actual_label"].tolist()[0] == "GOOD_POSTURE"


def test_missing_columns_raise_schema_error(tmp_path: Path) -> None:
    path = tmp_path / "bad.csv"
    pd.DataFrame({"schema_version": [1]}).to_csv(path, index=False)
    with pytest.raises(CsvSchemaError):
        SessionDataLoader().load_samples([path])
