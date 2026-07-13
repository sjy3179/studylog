from pathlib import Path

from studylog_analysis.app import StudylogAnalysisApp
from studylog_analysis.cli import main


def test_app_creates_reports_and_charts(fixtures: Path, tmp_path: Path) -> None:
    result = StudylogAnalysisApp().run(
        [fixtures / "synthetic-session-samples.csv"],
        [fixtures / "synthetic-session-summary.csv"],
        [fixtures / "synthetic-evaluation.csv"],
        tmp_path,
    )
    assert result.model is not None
    assert (tmp_path / "summary.txt").exists()
    assert (tmp_path / "summary.json").exists()
    assert (tmp_path / "confusion_matrix.png").exists()
    assert (tmp_path / "study_status_timeline.png").exists()
    assert (tmp_path / "confidence_correct_vs_incorrect.png").exists()


def test_cli_success(fixtures: Path, tmp_path: Path) -> None:
    code = main(
        [
            "--samples",
            str(fixtures / "synthetic-session-samples.csv"),
            "--summary",
            str(fixtures / "synthetic-session-summary.csv"),
            "--evaluation",
            str(fixtures / "synthetic-evaluation.csv"),
            "--output",
            str(tmp_path),
            "--no-charts",
        ]
    )
    assert code == 0
