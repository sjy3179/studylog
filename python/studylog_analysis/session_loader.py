from collections.abc import Sequence
from pathlib import Path

import pandas as pd

from .constants import SAMPLE_COLUMNS, SUMMARY_COLUMNS
from .errors import CsvDataError, CsvFileNotFoundError
from .schema import validate_columns


class SessionDataLoader:
    """세션 표본 및 요약 CSV를 읽고 기본 스키마를 검증한다."""

    def __init__(self, strict: bool = False) -> None:
        self.strict = strict

    def load_samples(self, paths: Sequence[Path]) -> pd.DataFrame:
        """Load and validate one or more session sample CSV files."""
        return self._load(paths, SAMPLE_COLUMNS, ["session_id", "sequence"], "세션 표본")

    def load_summaries(self, paths: Sequence[Path]) -> pd.DataFrame:
        """Load and validate one or more session summary CSV files."""
        return self._load(paths, SUMMARY_COLUMNS, ["session_id"], "세션 요약")

    def _load(self, paths: Sequence[Path], columns: tuple[str, ...], keys: list[str], name: str) -> pd.DataFrame:
        frames = []
        for path in paths:
            if not path.is_file():
                raise CsvFileNotFoundError(f"파일을 찾을 수 없습니다: {path}")
            frame = pd.read_csv(path, encoding="utf-8-sig", dtype=str, keep_default_na=False)
            if frame.empty:
                raise CsvDataError(f"{name} CSV가 비어 있습니다: {path}")
            validate_columns(frame, columns, str(path))
            frames.append(frame)
        if not frames:
            return pd.DataFrame(columns=columns)
        merged = pd.concat(frames, ignore_index=True)
        conflicts = merged[merged.duplicated(keys, keep=False)].groupby(keys, dropna=False).nunique().max(axis=1)
        if self.strict and (conflicts > 1).any():
            raise CsvDataError(f"{name} CSV에 충돌하는 중복 키가 있습니다.")
        return merged.drop_duplicates().drop_duplicates(keys, keep="last").reset_index(drop=True)
