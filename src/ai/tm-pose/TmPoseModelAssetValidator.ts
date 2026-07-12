import { TM_POSE_INFERENCE_CONFIG, TM_POSE_MODEL_CONFIG } from '@/ai/tm-pose/tm-pose-config'
import { TmPoseError } from '@/ai/tm-pose/tm-pose-errors'
import type { TmPoseMetadata } from '@/ai/tm-pose/tm-pose-types'
import type { TmPoseLabel } from '@/types/study'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export class TmPoseModelAssetValidator {
  async loadMetadata(
    url: string,
    fetcher: typeof fetch = fetch,
  ): Promise<TmPoseMetadata> {
    let response: Response
    try {
      response = await fetcher(url, { cache: 'no-store' })
    } catch (error) {
      throw new TmPoseError(
        'METADATA_NOT_FOUND',
        error instanceof Error ? error.message : 'metadata.json 요청에 실패했습니다.',
        url,
      )
    }
    if (!response.ok) {
      throw new TmPoseError('METADATA_NOT_FOUND', `metadata.json HTTP ${response.status}`, url)
    }
    let value: unknown
    try {
      value = await response.json()
    } catch {
      throw new TmPoseError('METADATA_INVALID', 'metadata.json을 파싱하지 못했습니다.', url)
    }
    return this.validateMetadata(value)
  }

  validateMetadata(value: unknown): TmPoseMetadata {
    if (!isRecord(value) || !Array.isArray(value.labels)) {
      throw new TmPoseError('METADATA_INVALID', 'metadata labels가 배열이 아닙니다.')
    }
    const labels = value.labels
    if (labels.some((label) => typeof label !== 'string' || label.trim().length === 0)) {
      throw new TmPoseError('METADATA_INVALID', '빈 라벨 또는 문자열이 아닌 라벨이 있습니다.')
    }
    if (labels.length !== TM_POSE_MODEL_CONFIG.expectedLabels.length) {
      throw new TmPoseError('LABEL_COUNT_MISMATCH', '자세 모델 클래스 수는 정확히 4개여야 합니다.')
    }
    if (new Set(labels).size !== labels.length) {
      throw new TmPoseError('METADATA_INVALID', '중복된 자세 모델 라벨이 있습니다.')
    }
    this.validateModelLabels(labels)
    return value as unknown as TmPoseMetadata
  }

  validateModelLabels(labels: readonly string[]): TmPoseLabel[] {
    const expected = TM_POSE_MODEL_CONFIG.expectedLabels
    if (labels.length !== expected.length) {
      throw new TmPoseError('LABEL_COUNT_MISMATCH', '모델 출력 클래스 수가 metadata와 다릅니다.')
    }
    const actual = new Set(labels)
    if (expected.some((label) => !actual.has(label))) {
      throw new TmPoseError('LABEL_NAME_MISMATCH', '예상한 네 자세 클래스와 모델 라벨이 다릅니다.')
    }
    return [...expected]
  }

  resolveInputResolution(metadata: TmPoseMetadata): number {
    const value = metadata.modelSettings?.posenet?.inputResolution
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return TM_POSE_INFERENCE_CONFIG.defaultInputResolution
    }
    return Math.min(
      TM_POSE_INFERENCE_CONFIG.maxInputResolution,
      Math.max(TM_POSE_INFERENCE_CONFIG.minInputResolution, Math.round(value)),
    )
  }
}
