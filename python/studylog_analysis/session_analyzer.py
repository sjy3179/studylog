import pandas as pd

from .constants import DURATION_COLUMNS, SESSION_KINDS
from .models import SessionMetrics


class SessionAnalyzer:
    """세션 시간, 자세 상태, 과목별 지표를 계산한다."""

    def analyze(
        self, samples: pd.DataFrame, summaries: pd.DataFrame, include_demo: bool = False, session_id: str | None = None
    ) -> tuple[SessionMetrics | None, int, pd.DataFrame]:
        """Calculate final session metrics without summing cumulative sample rows."""
        sample_frame = samples.copy()
        summary_frame = summaries.copy()
        if session_id:
            sample_frame = sample_frame[sample_frame["session_id"] == session_id]
            summary_frame = summary_frame[summary_frame["session_id"] == session_id]
        excluded_ids: set[str] = set()
        if not include_demo:
            for frame in (summary_frame, sample_frame):
                if not frame.empty:
                    excluded_ids.update(frame.loc[frame["session_kind"] != "AI", "session_id"].astype(str))
                    frame.drop(frame[frame["session_kind"] != "AI"].index, inplace=True)
        finals = self._final_durations(sample_frame, summary_frame)
        if finals.empty:
            return None, len(excluded_ids), finals
        durations = {column: int(finals[column].fillna(0).sum()) for column in DURATION_COLUMNS}
        total = durations["total_session_ms"]
        seated = durations["seated_ms"]
        good = max(0, seated - durations["posture_caution_ms"])
        recommended = max(0, seated - durations["lux_caution_ms"])
        goals = pd.to_numeric(finals.get("goal_minutes", 0), errors="coerce").fillna(0).sum() * 60_000
        by_subject = {
            str(key or "미지정"): int(group["effective_study_ms"].sum())
            for key, group in finals.groupby(
                finals.get("subject", pd.Series("미지정", index=finals.index)).fillna("미지정")
            )
        }
        final_kinds = finals.get("session_kind", pd.Series(dtype=str))
        kind_counts = {kind: int((final_kinds == kind).sum()) for kind in SESSION_KINDS}
        return (
            SessionMetrics(
                session_count=len(finals),
                completed_count=int((finals.get("status") == "COMPLETED").sum()) if "status" in finals else 0,
                interrupted_count=int((finals.get("status") == "INTERRUPTED").sum()) if "status" in finals else 0,
                durations=durations,
                effective_study_ratio=durations["effective_study_ms"] / total if total else None,
                good_posture_ratio=good / seated if seated else None,
                recommended_lux_ratio=recommended / seated if seated else None,
                goal_progress_ratio=durations["effective_study_ms"] / goals if goals else None,
                by_subject=by_subject,
                kind_counts=kind_counts,
            ),
            len(excluded_ids),
            finals,
        )

    def _final_durations(self, samples: pd.DataFrame, summaries: pd.DataFrame) -> pd.DataFrame:
        """Use summary, else last valid sample, else maxima; never sum cumulative sample rows."""
        rows: list[pd.Series] = []
        summary_ids = set(summaries.get("session_id", pd.Series(dtype=str)).astype(str))
        for _, row in summaries.iterrows():
            rows.append(row)
        for session_id, group in samples.groupby("session_id"):
            if str(session_id) in summary_ids:
                continue
            ordered = group.sort_values([column for column in ("sequence", "timestamp_iso") if column in group])
            valid = ordered.dropna(subset=list(DURATION_COLUMNS), how="all")
            if valid.empty:
                continue
            row = valid.iloc[-1].copy()
            maxima = valid[list(DURATION_COLUMNS)].max()
            for column in DURATION_COLUMNS:
                if pd.isna(row.get(column)):
                    row[column] = maxima[column]
            rows.append(row)
        return (
            pd.DataFrame(rows).reset_index(drop=True)
            if rows
            else pd.DataFrame(columns=("session_id", *DURATION_COLUMNS))
        )
