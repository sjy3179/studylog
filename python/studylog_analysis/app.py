from dataclasses import replace
from pathlib import Path

import pandas as pd

from .chart_generator import ChartGenerator
from .evaluation_loader import EvaluationDataLoader
from .lux_analyzer import LuxAnalyzer
from .model_evaluator import ModelEvaluator
from .models import AnalysisResult, DataQuality
from .preprocessor import DataPreprocessor
from .report_generator import ReportGenerator
from .session_analyzer import SessionAnalyzer
from .session_loader import SessionDataLoader


class StudylogAnalysisApp:
    """로더, 분석기, 차트, 리포트를 조합해 실행한다."""

    def __init__(self, strict: bool = False) -> None:
        self.session_loader = SessionDataLoader(strict)
        self.evaluation_loader = EvaluationDataLoader(strict)
        self.preprocessor = DataPreprocessor(strict)
        self.session_analyzer = SessionAnalyzer()
        self.lux_analyzer = LuxAnalyzer()
        self.model_evaluator = ModelEvaluator()
        self.chart_generator = ChartGenerator()
        self.report_generator = ReportGenerator()

    def run(
        self,
        samples: list[Path],
        summaries: list[Path],
        evaluations: list[Path],
        output: Path,
        include_demo: bool = False,
        session_id: str | None = None,
        model_version: str | None = None,
        charts: bool = True,
    ) -> AnalysisResult:
        """Run loading, preprocessing, analysis, charting, and reporting."""
        sample_raw = self.session_loader.load_samples(samples) if samples else pd.DataFrame()
        summary_raw = self.session_loader.load_summaries(summaries) if summaries else pd.DataFrame()
        evaluation_raw = self.evaluation_loader.load(evaluations) if evaluations else pd.DataFrame()
        sample_frame, sample_quality = self.preprocessor.process(sample_raw)
        summary_frame, summary_quality = self.preprocessor.process(summary_raw)
        evaluation_frame, evaluation_quality = self.preprocessor.process(evaluation_raw)
        session, excluded, _ = self.session_analyzer.analyze(sample_frame, summary_frame, include_demo, session_id)
        if not include_demo and not sample_frame.empty:
            sample_frame = sample_frame[sample_frame["session_kind"] == "AI"]
        lux = self.lux_analyzer.analyze(sample_frame)
        model = self.model_evaluator.evaluate(evaluation_frame, model_version)
        quality = DataQuality(
            input_rows=sample_quality.input_rows + summary_quality.input_rows + evaluation_quality.input_rows,
            used_rows=sample_quality.used_rows + summary_quality.used_rows + evaluation_quality.used_rows,
            duplicate_rows=sample_quality.duplicate_rows
            + summary_quality.duplicate_rows
            + evaluation_quality.duplicate_rows,
            invalid_rows=sample_quality.invalid_rows + summary_quality.invalid_rows + evaluation_quality.invalid_rows,
            missing_values=sample_quality.missing_values
            + summary_quality.missing_values
            + evaluation_quality.missing_values,
            excluded_demo_sessions=excluded,
            unknown_labels=evaluation_quality.unknown_labels,
        )
        warnings = list(model.warnings if model else [])
        if session and session.session_count < 3:
            warnings.append("현재 세션 수가 적어 결과를 일반화하기 어렵습니다.")
        result = AnalysisResult(session, lux, model, quality, warnings)
        self.report_generator.generate(result, output)
        if charts:
            self.chart_generator.generate(result, sample_frame, evaluation_frame, output)
        return replace(result)
