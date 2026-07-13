from collections.abc import Iterable

import pandas as pd

from .constants import SCHEMA_VERSION
from .errors import CsvSchemaError


def validate_columns(frame: pd.DataFrame, required: Iterable[str], source: str) -> None:
    missing = [column for column in required if column not in frame.columns]
    if missing:
        raise CsvSchemaError(f"{source}: 필수 컬럼 누락: {', '.join(missing)}")
    versions = pd.to_numeric(frame["schema_version"], errors="coerce").dropna().unique()
    if len(versions) != 1 or int(versions[0]) != SCHEMA_VERSION:
        raise CsvSchemaError(f"{source}: 지원하지 않는 schema_version")
