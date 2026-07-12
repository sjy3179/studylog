import pandas as pd
from sklearn.metrics import accuracy_score, confusion_matrix, precision_recall_fscore_support

from .constants import POSE_LABELS
from .models import ModelMetrics


class ModelEvaluator:
    """Teachable Machine Pose 평가 기록으로 분류 성능을 계산한다."""

    def evaluate(self, records: pd.DataFrame, model_version: str | None = None) -> ModelMetrics | None:
        """Calculate fixed-label classification and conditional accuracy metrics."""
        frame = records.copy()
        if model_version and "model_version" in frame:
            frame = frame[frame["model_version"] == model_version]
        if frame.empty:
            return None
        actual, predicted = frame["actual_label"], frame["predicted_label"]
        matrix = confusion_matrix(actual, predicted, labels=POSE_LABELS).tolist()
        precision, recall, f1, support = precision_recall_fscore_support(
            actual, predicted, labels=POSE_LABELS, zero_division=0
        )
        _, _, macro_f1, _ = precision_recall_fscore_support(actual, predicted, average="macro", zero_division=0)
        macro_precision, macro_recall, _, _ = precision_recall_fscore_support(
            actual, predicted, average="macro", zero_division=0
        )
        _, _, weighted_f1, _ = precision_recall_fscore_support(actual, predicted, average="weighted", zero_division=0)
        class_rows = [
            {
                "label": label,
                "precision": float(precision[i]),
                "recall": float(recall[i]),
                "f1": float(f1[i]),
                "support": int(support[i]),
                "average_confidence": float(frame.loc[actual == label, "average_confidence"].mean())
                if (actual == label).any()
                else None,
            }
            for i, label in enumerate(POSE_LABELS)
        ]

        def grouped(column: str) -> list[dict[str, object]]:
            return [
                {
                    column: str(key),
                    "count": len(group),
                    "accuracy": float((group["actual_label"] == group["predicted_label"]).mean()),
                }
                for key, group in frame.groupby(column)
            ]

        wrong = frame[actual != predicted]
        pairs = wrong.groupby(["actual_label", "predicted_label"]).size().sort_values(ascending=False)
        correct = frame[actual == predicted]
        confidence_bins = []
        for label, lower, upper in (("LOW", 0.0, 0.6), ("MEDIUM", 0.6, 0.8), ("HIGH", 0.8, 1.01)):
            group = frame[frame["average_confidence"].between(lower, upper, inclusive="left")]
            confidence_bins.append(
                {
                    "range": label,
                    "count": len(group),
                    "accuracy": float((group["actual_label"] == group["predicted_label"]).mean())
                    if len(group)
                    else None,
                }
            )
        error_columns = [
            column
            for column in ("evaluation_id", "actual_label", "predicted_label", "average_confidence")
            if column in frame
        ]
        low_errors = wrong[wrong["average_confidence"] < 0.6][error_columns].to_dict("records")
        high_errors = wrong[wrong["average_confidence"] >= 0.8][error_columns].to_dict("records")
        warnings = []
        if len(frame) < 20:
            warnings.append("평가 기록이 20개 미만이어서 일반화하기 어렵습니다.")
        if any(row["support"] < 5 for row in class_rows):
            warnings.append("일부 클래스의 support가 5개 미만입니다.")
        if frame["participant_code"].nunique() < 2:
            warnings.append("참여자가 1명뿐입니다.")
        if frame["model_version"].nunique() > 1:
            warnings.append("여러 model_version이 섞여 있습니다.")
        return ModelMetrics(
            record_count=len(frame),
            accuracy=float(accuracy_score(actual, predicted)),
            macro_precision=float(macro_precision),
            macro_recall=float(macro_recall),
            macro_f1=float(macro_f1),
            weighted_f1=float(weighted_f1),
            confusion_matrix=matrix,
            class_metrics=class_rows,
            participant_metrics=grouped("participant_code"),
            lighting_metrics=grouped("lighting_condition"),
            distance_metrics=grouped("camera_distance"),
            model_version_metrics=grouped("model_version"),
            mirror_metrics=grouped("mirror_camera"),
            correct_average_confidence=self._mean_confidence(correct),
            incorrect_average_confidence=self._mean_confidence(wrong),
            confidence_bins=confidence_bins,
            low_confidence_errors=low_errors,
            high_confidence_errors=high_errors,
            misclassification_pairs=[
                {"actual_label": a, "predicted_label": p, "count": int(count)} for (a, p), count in pairs.items()
            ],
            warnings=warnings,
        )

    @staticmethod
    def _mean_confidence(frame: pd.DataFrame) -> float | None:
        """Return an average confidence while preserving unavailable data as null."""
        if frame.empty or frame["average_confidence"].dropna().empty:
            return None
        return float(frame["average_confidence"].mean())
