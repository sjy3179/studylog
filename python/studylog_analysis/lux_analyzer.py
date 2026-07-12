import pandas as pd

from .constants import LUX_STATES
from .models import LuxMetrics


class LuxAnalyzer:
    """가상 조도 수치와 상태 분포를 분석한다."""

    def analyze(self, samples: pd.DataFrame) -> LuxMetrics | None:
        """Calculate descriptive Lux metrics and warning-state streaks."""
        if samples.empty or "lux" not in samples:
            return None
        lux = pd.to_numeric(samples["lux"], errors="coerce").dropna()
        if lux.empty:
            return None
        ratios = {state: float((samples.get("lux_status") == state).mean()) for state in LUX_STATES}
        longest = 0
        current = 0
        ordered = samples.sort_values([column for column in ("session_id", "elapsed_ms") if column in samples])
        previous_session = None
        previous_elapsed = None
        for _, row in ordered.iterrows():
            elapsed = row.get("elapsed_ms")
            if row.get("session_id") != previous_session:
                current = 0
                previous_elapsed = None
            delta = (
                0
                if previous_elapsed is None or pd.isna(elapsed)
                else max(0, min(2_000, int(elapsed - previous_elapsed)))
            )
            current = current + delta if row.get("lux_status") != "RECOMMENDED" else 0
            longest = max(longest, current)
            previous_session, previous_elapsed = row.get("session_id"), elapsed
        return LuxMetrics(
            len(lux),
            float(lux.mean()),
            float(lux.median()),
            float(lux.min()),
            float(lux.max()),
            float(lux.std(ddof=0)),
            ratios,
            longest,
        )
