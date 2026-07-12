from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass(frozen=True)
class DataQuality:
    input_rows: int = 0
    used_rows: int = 0
    duplicate_rows: int = 0
    invalid_rows: int = 0
    missing_values: int = 0
    excluded_demo_sessions: int = 0
    unknown_labels: int = 0


@dataclass(frozen=True)
class SessionMetrics:
    session_count: int
    completed_count: int
    interrupted_count: int
    durations: dict[str, int]
    effective_study_ratio: float | None
    good_posture_ratio: float | None
    recommended_lux_ratio: float | None
    goal_progress_ratio: float | None
    by_subject: dict[str, int] = field(default_factory=dict)
    kind_counts: dict[str, int] = field(default_factory=dict)


@dataclass(frozen=True)
class LuxMetrics:
    count: int
    mean: float | None
    median: float | None
    minimum: float | None
    maximum: float | None
    standard_deviation: float | None
    state_ratios: dict[str, float]
    longest_non_recommended_ms: int


@dataclass(frozen=True)
class ModelMetrics:
    record_count: int
    accuracy: float | None
    macro_precision: float | None
    macro_recall: float | None
    macro_f1: float | None
    weighted_f1: float | None
    confusion_matrix: list[list[int]]
    class_metrics: list[dict[str, Any]]
    participant_metrics: list[dict[str, Any]]
    lighting_metrics: list[dict[str, Any]]
    distance_metrics: list[dict[str, Any]]
    model_version_metrics: list[dict[str, Any]]
    mirror_metrics: list[dict[str, Any]]
    correct_average_confidence: float | None
    incorrect_average_confidence: float | None
    confidence_bins: list[dict[str, Any]]
    low_confidence_errors: list[dict[str, Any]]
    high_confidence_errors: list[dict[str, Any]]
    misclassification_pairs: list[dict[str, Any]]
    warnings: list[str]


@dataclass(frozen=True)
class AnalysisResult:
    session: SessionMetrics | None
    lux: LuxMetrics | None
    model: ModelMetrics | None
    quality: DataQuality
    warnings: list[str]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
