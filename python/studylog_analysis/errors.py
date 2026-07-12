class StudylogAnalysisError(Exception):
    """studylog 분석 프로그램 기본 예외."""


class CsvFileNotFoundError(StudylogAnalysisError):
    pass


class CsvSchemaError(StudylogAnalysisError):
    pass


class CsvDataError(StudylogAnalysisError):
    pass


class InsufficientDataError(StudylogAnalysisError):
    pass
