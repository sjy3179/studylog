from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from .constants import DURATION_COLUMNS, POSE_LABELS
from .models import AnalysisResult


class ChartGenerator:
    """분석 결과를 matplotlib 이미지로 생성한다."""

    def generate(
        self,
        result: AnalysisResult,
        samples: pd.DataFrame,
        evaluations: pd.DataFrame,
        output: Path,
    ) -> list[Path]:
        """Create available charts and return their output paths."""
        output.mkdir(parents=True, exist_ok=True)
        created: list[Path] = []
        if result.session:
            labels = [column.removesuffix("_ms") for column in DURATION_COLUMNS[1:]]
            values = [result.session.durations[column] / 60_000 for column in DURATION_COLUMNS[1:]]
            created.append(
                self._bar(
                    labels, values, "Session duration breakdown", "Minutes", output / "session_duration_breakdown.png"
                )
            )
        if not samples.empty and "stable_posture_state" in samples:
            counts = samples["stable_posture_state"].value_counts()
            created.append(
                self._bar(
                    list(counts.index),
                    list(counts.values),
                    "Posture state distribution",
                    "Samples",
                    output / "posture_state_distribution.png",
                )
            )
        if not samples.empty and {"elapsed_ms", "lux"}.issubset(samples.columns):
            figure, axis = plt.subplots(figsize=(8, 4))
            axis.plot(samples["elapsed_ms"] / 1000, samples["lux"])
            axis.set(title="Lux timeline", xlabel="Elapsed seconds", ylabel="Lux")
            created.append(self._save(figure, output / "lux_timeline.png"))
        if not samples.empty and {"elapsed_ms", "study_status"}.issubset(samples.columns):
            states = list(dict.fromkeys(samples["study_status"].dropna().astype(str)))
            state_values = {state: index for index, state in enumerate(states)}
            figure, axis = plt.subplots(figsize=(8, 4))
            axis.step(
                samples["elapsed_ms"] / 1000,
                samples["study_status"].map(state_values),
                where="post",
            )
            axis.set_yticks(list(state_values.values()), list(state_values.keys()))
            axis.set(title="Study status timeline", xlabel="Elapsed seconds", ylabel="Status")
            created.append(self._save(figure, output / "study_status_timeline.png"))
        if result.model:
            figure, axis = plt.subplots(figsize=(6, 5))
            image = axis.imshow(np.array(result.model.confusion_matrix), cmap="Blues")
            axis.set_xticks(range(4), POSE_LABELS, rotation=30, ha="right")
            axis.set_yticks(range(4), POSE_LABELS)
            axis.set(xlabel="Predicted", ylabel="Actual", title="Confusion matrix")
            for row in range(4):
                for column in range(4):
                    axis.text(column, row, result.model.confusion_matrix[row][column], ha="center", va="center")
            figure.colorbar(image, ax=axis)
            created.append(self._save(figure, output / "confusion_matrix.png"))
            created.append(
                self._bar(
                    [row["label"] for row in result.model.class_metrics],
                    [row["f1"] for row in result.model.class_metrics],
                    "Class F1 scores",
                    "F1",
                    output / "class_metrics.png",
                )
            )
            for rows, name, title in (
                (result.model.participant_metrics, "accuracy_by_participant.png", "Accuracy by participant"),
                (result.model.lighting_metrics, "accuracy_by_lighting.png", "Accuracy by lighting"),
            ):
                if rows:
                    created.append(
                        self._bar(
                            [str(row[next(iter(row))]) for row in rows],
                            [row["accuracy"] for row in rows],
                            title,
                            "Accuracy",
                            output / name,
                        )
                    )
            required = {"actual_label", "predicted_label", "average_confidence"}
            if not evaluations.empty and required.issubset(evaluations.columns):
                confidence = evaluations.copy()
                confidence["outcome"] = np.where(
                    confidence["actual_label"] == confidence["predicted_label"],
                    "Correct",
                    "Incorrect",
                )
                groups = confidence.groupby("outcome")["average_confidence"].mean()
                created.append(
                    self._bar(
                        list(groups.index),
                        list(groups.values),
                        "Confidence: correct vs incorrect",
                        "Average confidence",
                        output / "confidence_correct_vs_incorrect.png",
                    )
                )
        return created

    def _bar(self, labels: list[object], values: list[object], title: str, ylabel: str, path: Path) -> Path:
        figure, axis = plt.subplots(figsize=(8, 4))
        axis.bar([str(value) for value in labels], values)
        axis.set(title=title, ylabel=ylabel)
        axis.tick_params(axis="x", rotation=25)
        return self._save(figure, path)

    @staticmethod
    def _save(figure: plt.Figure, path: Path) -> Path:
        figure.tight_layout()
        figure.savefig(path, dpi=160)
        plt.close(figure)
        return path
