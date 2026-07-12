from collections.abc import Sequence
from pathlib import Path

import pandas as pd

from .constants import EVALUATION_COLUMNS, POSE_LABELS
from .errors import CsvDataError, CsvFileNotFoundError
from .schema import validate_columns


class EvaluationDataLoader:
    """모델 평가 CSV를 읽고 평가 스키마를 검증한다."""

    def __init__(self, strict: bool = False) -> None:
        self.strict = strict

    def load(self, paths: Sequence[Path]) -> pd.DataFrame:
        """Load evaluation CSV files and enforce the four fixed pose labels."""
        frames = []
        for path in paths:
            if not path.is_file():
                raise CsvFileNotFoundError(f"파일을 찾을 수 없습니다: {path}")
            frame = pd.read_csv(path, encoding="utf-8-sig", dtype=str, keep_default_na=False)
            if frame.empty:
                raise CsvDataError(f"평가 CSV가 비어 있습니다: {path}")
            validate_columns(frame, EVALUATION_COLUMNS, str(path))
            unknown = set(frame["actual_label"]) | set(frame["predicted_label"])
            unknown -= set(POSE_LABELS)
            if unknown:
                raise CsvDataError(f"알 수 없는 자세 라벨: {sorted(unknown)}")
            frames.append(frame)
        if not frames:
            return pd.DataFrame(columns=EVALUATION_COLUMNS)
        merged = pd.concat(frames, ignore_index=True)
        if self.strict and merged.duplicated("evaluation_id", keep=False).any():
            raise CsvDataError("평가 CSV에 중복 evaluation_id가 있습니다.")
        return merged.drop_duplicates().drop_duplicates("evaluation_id", keep="last").reset_index(drop=True)
