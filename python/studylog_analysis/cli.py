import argparse
import sys
from pathlib import Path

from .app import StudylogAnalysisApp
from .errors import CsvDataError, CsvFileNotFoundError, CsvSchemaError, InsufficientDataError, StudylogAnalysisError


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser(description="studylog Phase 5 CSV 오프라인 분석")
    result.add_argument("--samples", nargs="*", type=Path, default=[])
    result.add_argument("--summary", nargs="*", type=Path, default=[])
    result.add_argument("--evaluation", nargs="*", type=Path, default=[])
    result.add_argument("--output", type=Path, default=Path("reports"))
    result.add_argument("--include-demo", action="store_true")
    result.add_argument("--strict", action="store_true")
    result.add_argument("--no-charts", action="store_true")
    result.add_argument("--session-id")
    result.add_argument("--model-version")
    result.add_argument("--debug", action="store_true")
    return result


def main(argv: list[str] | None = None) -> int:
    args = parser().parse_args(argv)
    if not (args.samples or args.summary or args.evaluation):
        parser().error("세션 또는 평가 CSV를 하나 이상 지정해야 합니다.")
    print("studylog Python 분석을 시작합니다.")
    print(f"[입력] 표본 {len(args.samples)}개, 요약 {len(args.summary)}개, 평가 {len(args.evaluation)}개")
    try:
        app = StudylogAnalysisApp(args.strict)
        result = app.run(
            args.samples,
            args.summary,
            args.evaluation,
            args.output,
            args.include_demo,
            args.session_id,
            args.model_version,
            not args.no_charts,
        )
        print(app.report_generator.summary_text(result))
        print(f"분석이 완료되었습니다: {args.output}")
        return 0
    except (CsvFileNotFoundError, CsvSchemaError, CsvDataError) as error:
        if args.debug:
            raise
        print(f"입력 오류: {error}", file=sys.stderr)
        return 3
    except InsufficientDataError as error:
        if args.debug:
            raise
        print(f"데이터 부족: {error}", file=sys.stderr)
        return 4
    except (OSError, StudylogAnalysisError) as error:
        if args.debug:
            raise
        print(f"출력 오류: {error}", file=sys.stderr)
        return 5


if __name__ == "__main__":
    raise SystemExit(main())
