import pandas as pd

from .constants import DURATION_COLUMNS, POSE_LABELS
from .errors import CsvDataError
from .models import DataQuality


class DataPreprocessor:
    """문자열 CSV 값을 분석 가능한 타입으로 변환하고 품질 이슈를 기록한다."""

    BOOLEAN_COLUMNS = (
        "runtime_ready",
        "effective_time_eligible",
        "tm_fresh",
        "pose_detected",
        "mediapipe_fresh",
        "correct",
        "mirror_camera",
        "count_lux_in_effective_time",
    )
    PROBABILITY_COLUMNS = (
        "tm_confidence",
        "tm_good_probability",
        "tm_forward_probability",
        "tm_side_probability",
        "tm_resting_probability",
        "average_confidence",
        "average_good_probability",
        "average_forward_probability",
        "average_side_probability",
        "average_resting_probability",
        "good_posture_ratio",
        "recommended_lux_ratio",
        "effective_study_ratio",
    )
    NUMERIC_COLUMNS = (
        *DURATION_COLUMNS,
        "elapsed_ms",
        "goal_minutes",
        "lux",
        "deviation_score",
        "sequence",
        "goal_progress_ratio",
        "average_lux",
        "minimum_lux",
        "maximum_lux",
        "sample_count",
        "valid_sample_count",
        "rejected_sample_count",
        "collection_duration_ms",
        *PROBABILITY_COLUMNS,
    )
    DATETIME_COLUMNS = ("timestamp_iso", "started_at_iso", "ended_at_iso", "created_at_iso")

    def __init__(self, strict: bool = False) -> None:
        self.strict = strict

    def process(self, frame: pd.DataFrame) -> tuple[pd.DataFrame, DataQuality]:
        """Convert raw CSV strings and return normalized data with quality counts."""
        result = frame.copy()
        input_rows = len(result)
        invalid = 0
        for column in self.BOOLEAN_COLUMNS:
            if column in result:
                result[column] = result[column].map(self._boolean)
                invalid += int(result[column].isna().sum() - (frame[column] == "").sum())
        for column in self.NUMERIC_COLUMNS:
            if column in result:
                result[column] = pd.to_numeric(result[column].replace("", pd.NA), errors="coerce")
                if column in DURATION_COLUMNS or column in {
                    "goal_minutes",
                    "lux",
                    "valid_sample_count",
                    "rejected_sample_count",
                    "collection_duration_ms",
                }:
                    invalid += int((result[column] < 0).sum())
                    result.loc[result[column] < 0, column] = pd.NA
                if column in self.PROBABILITY_COLUMNS:
                    out = result[column].notna() & ~result[column].between(0, 1)
                    invalid += int(out.sum())
                    result.loc[out, column] = pd.NA
        for column in self.DATETIME_COLUMNS:
            if column in result:
                result[column] = pd.to_datetime(result[column].replace("", pd.NA), errors="coerce", utc=True)
        for column in ("control_modes_used", "model_versions", "deviation_reasons"):
            if column in result:
                result[column] = result[column].map(lambda value: [] if value == "" else str(value).split("|"))
        unknown = 0
        for column in ("actual_label", "predicted_label"):
            if column in result:
                unknown += int((~result[column].isin(POSE_LABELS)).sum())
        if self.strict and (invalid or unknown):
            raise CsvDataError(f"유효하지 않은 값이 있습니다: invalid={invalid}, unknown_labels={unknown}")
        return result, DataQuality(
            input_rows=input_rows,
            used_rows=len(result),
            invalid_rows=invalid,
            missing_values=int(result.isna().sum().sum()),
            unknown_labels=unknown,
        )

    @staticmethod
    def _boolean(value: object) -> bool | None:
        if value in (True, "true", "True", "1", 1):
            return True
        if value in (False, "false", "False", "0", 0):
            return False
        if value in ("", None):
            return None
        return None
