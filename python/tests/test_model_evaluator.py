from pathlib import Path

from studylog_analysis.constants import POSE_LABELS
from studylog_analysis.evaluation_loader import EvaluationDataLoader
from studylog_analysis.model_evaluator import ModelEvaluator
from studylog_analysis.preprocessor import DataPreprocessor


def test_metrics_and_fixed_confusion_matrix(fixtures: Path) -> None:
    records, _ = DataPreprocessor().process(EvaluationDataLoader().load([fixtures / "synthetic-evaluation.csv"]))
    metrics = ModelEvaluator().evaluate(records)
    assert metrics is not None
    assert metrics.accuracy == 0.75
    assert len(metrics.confusion_matrix) == len(POSE_LABELS) == 4
    assert all(len(row) == 4 for row in metrics.confusion_matrix)
    assert metrics.misclassification_pairs[0]["actual_label"] == "GOOD_POSTURE"
