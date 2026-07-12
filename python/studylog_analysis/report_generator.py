import json
from pathlib import Path

import pandas as pd

from .models import AnalysisResult


class ReportGenerator:
    """분석 결과를 텍스트, JSON, CSV 파일로 내보낸다."""

    def generate(self, result: AnalysisResult, output: Path) -> list[Path]:
        """Write text, JSON, and analysis CSV reports to the output directory."""
        output.mkdir(parents=True, exist_ok=True)
        paths = [
            output / "summary.txt",
            output / "summary.json",
            output / "session_metrics.csv",
            output / "class_metrics.csv",
            output / "participant_metrics.csv",
            output / "lighting_metrics.csv",
            output / "misclassification_pairs.csv",
            output / "data_quality.json",
        ]
        paths[0].write_text(self.summary_text(result), encoding="utf-8")
        paths[1].write_text(json.dumps(result.to_dict(), ensure_ascii=False, indent=2), encoding="utf-8")
        pd.DataFrame([result.session.__dict__] if result.session else []).to_csv(
            paths[2], index=False, encoding="utf-8-sig"
        )
        pd.DataFrame(result.model.class_metrics if result.model else []).to_csv(
            paths[3], index=False, encoding="utf-8-sig"
        )
        pd.DataFrame(result.model.participant_metrics if result.model else []).to_csv(
            paths[4], index=False, encoding="utf-8-sig"
        )
        pd.DataFrame(result.model.lighting_metrics if result.model else []).to_csv(
            paths[5], index=False, encoding="utf-8-sig"
        )
        pd.DataFrame(result.model.misclassification_pairs if result.model else []).to_csv(
            paths[6], index=False, encoding="utf-8-sig"
        )
        paths[7].write_text(json.dumps(result.quality.__dict__, ensure_ascii=False, indent=2), encoding="utf-8")
        return paths

    def summary_text(self, result: AnalysisResult) -> str:
        """Render a concise Korean terminal and text-file summary."""
        session = result.session
        model = result.model
        lines = [
            "[studylog 분석 결과]",
            "",
            "데이터",
            f"- 세션: {session.session_count if session else 0}개",
            f"- 평가 기록: {model.record_count if model else 0}개",
            f"- 제외된 데모 세션: {result.quality.excluded_demo_sessions}개",
            "",
            "학습 세션",
        ]
        lines += (
            [
                f"- 전체 세션 시간: {self._duration(session.durations['total_session_ms'])}",
                f"- 순공 시간: {self._duration(session.durations['effective_study_ms'])}",
                f"- 순공 비율: {self._percent(session.effective_study_ratio)}",
                f"- 기준 자세 유지율: {self._percent(session.good_posture_ratio)}",
                f"- 적정 조도 유지율: {self._percent(session.recommended_lux_ratio)}",
            ]
            if session
            else ["- N/A"]
        )
        lines += [
            "",
            "자세 모델",
            f"- 전체 정확도: {self._percent(model.accuracy) if model else 'N/A'}",
            f"- Macro F1: {self._percent(model.macro_f1) if model else 'N/A'}",
        ]
        if model and model.misclassification_pairs:
            top_pair = model.misclassification_pairs[0]
            lines.append(f"- 최다 오분류: {top_pair['actual_label']} → {top_pair['predicted_label']}")
        lines += [
            "",
            "주의",
            "- 조도값은 가상 센서 시뮬레이션 데이터입니다.",
            "- 자세 주의와 조도 주의 시간은 서로 중첩될 수 있습니다.",
            *[f"- {warning}" for warning in result.warnings],
        ]
        return "\n".join(lines) + "\n"

    @staticmethod
    def _duration(milliseconds: int) -> str:
        seconds = milliseconds // 1000
        return f"{seconds // 3600:02d}:{seconds % 3600 // 60:02d}:{seconds % 60:02d}"

    @staticmethod
    def _percent(value: float | None) -> str:
        return "N/A" if value is None else f"{value * 100:.1f}%"
