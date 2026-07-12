import type { CustomPoseNet } from '@teachablemachine/pose'

import type { PostureClassifier, PostureClassifierInput } from '@/ai/PostureClassifier'
import { TM_POSE_INFERENCE_CONFIG, TM_POSE_MODEL_CONFIG, withModelVersion } from '@/ai/tm-pose/tm-pose-config'
import { TmPoseError, toTmPoseError } from '@/ai/tm-pose/tm-pose-errors'
import type {
  TmPoseEngineStatus,
  TmPoseMetadata,
  TmPoseModelInfo,
  TmPosePredictionResult,
  TmPoseRuntime,
} from '@/ai/tm-pose/tm-pose-types'
import { TmPoseInputAdapter } from '@/ai/tm-pose/TmPoseInputAdapter'
import { TmPoseModelAssetValidator } from '@/ai/tm-pose/TmPoseModelAssetValidator'
import { TmPoseRuntimeLoader } from '@/ai/tm-pose/TmPoseRuntimeLoader'
import { TM_POSE_LABELS, type TmPoseLabel } from '@/types/study'

interface ClassifierOptions {
  fetcher?: typeof fetch
  inputAdapter?: TmPoseInputAdapter
  now?: () => number
  onStatusChange?: (status: TmPoseEngineStatus) => void
  runtimeLoader?: TmPoseRuntimeLoader
  validator?: TmPoseModelAssetValidator
}

function createEmptyProbabilities(): Record<TmPoseLabel, number> {
  return {
    GOOD_POSTURE: 0,
    FORWARD_LEAN: 0,
    SIDE_LEAN: 0,
    RESTING: 0,
  }
}

function clampProbability(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

function poseIsAvailable(pose: Awaited<ReturnType<CustomPoseNet['estimatePose']>>['pose']): boolean {
  if (!pose || !Array.isArray(pose.keypoints)) return false
  const poseScore = typeof pose.score === 'number' ? pose.score : 0
  if (poseScore < TM_POSE_INFERENCE_CONFIG.minPoseScore) return false
  const important = new Set(['nose', 'leftShoulder', 'rightShoulder'])
  return pose.keypoints.some(
    (point) => important.has(point.part) && point.score >= TM_POSE_INFERENCE_CONFIG.minKeypointScore,
  )
}

export class TeachableMachinePoseClassifier
  implements
    PostureClassifier<
      PostureClassifierInput,
      TmPosePredictionResult,
      TmPoseEngineStatus,
      TmPoseModelInfo
    >
{
  private readonly fetcher: typeof fetch
  private readonly inputAdapter: TmPoseInputAdapter
  private readonly now: () => number
  private readonly onStatusChange?: (status: TmPoseEngineStatus) => void
  private readonly runtimeLoader: TmPoseRuntimeLoader
  private readonly validator: TmPoseModelAssetValidator
  private initializePromise: Promise<void> | null = null
  private generation = 0
  private metadata: TmPoseMetadata | null = null
  private model: CustomPoseNet | null = null
  private modelInfo: TmPoseModelInfo | null = null
  private runtime: TmPoseRuntime | null = null
  private status: TmPoseEngineStatus = 'IDLE'

  constructor(options: ClassifierOptions = {}) {
    this.fetcher = options.fetcher ?? fetch
    this.inputAdapter = options.inputAdapter ?? new TmPoseInputAdapter()
    this.now = options.now ?? (() => performance.now())
    this.onStatusChange = options.onStatusChange
    this.runtimeLoader = options.runtimeLoader ?? new TmPoseRuntimeLoader()
    this.validator = options.validator ?? new TmPoseModelAssetValidator()
  }

  initialize(): Promise<void> {
    if (this.model && this.status !== 'DISPOSED') return Promise.resolve()
    if (this.status === 'DISPOSED') {
      return Promise.reject(new TmPoseError('RUNTIME_DISPOSED', '이미 정리된 모델입니다.'))
    }
    if (this.initializePromise) return this.initializePromise
    this.initializePromise = this.initializeInternal()
      .catch((error) => {
        if (this.status !== 'DISPOSED' && this.status !== 'DISPOSING') this.setStatus('ERROR')
        throw error
      })
      .finally(() => {
        this.initializePromise = null
      })
    return this.initializePromise
  }

  async predict(input: PostureClassifierInput): Promise<TmPosePredictionResult> {
    if (this.status === 'DISPOSED' || this.status === 'DISPOSING') {
      throw new TmPoseError('RUNTIME_DISPOSED', '정리된 모델에서는 추론할 수 없습니다.')
    }
    if (!this.model || !this.runtime || !this.modelInfo || !this.metadata) {
      throw new TmPoseError('INPUT_NOT_READY', 'TM Pose 모델이 아직 준비되지 않았습니다.')
    }
    if (
      input.video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
      input.video.videoWidth <= 0 ||
      input.video.videoHeight <= 0
    ) {
      throw new TmPoseError('INPUT_NOT_READY', '카메라의 새 프레임을 기다리고 있습니다.')
    }

    this.setStatus('RUNNING')
    this.inputAdapter.configure({
      cropMode: 'CENTER_SQUARE',
      inputSize: this.modelInfo.inputResolution,
      mirror: input.mirrorCamera,
    })
    const startedAt = this.now()
    let estimate: Awaited<ReturnType<CustomPoseNet['estimatePose']>>
    try {
      estimate = await this.model.estimatePose(this.inputAdapter.capture(input.video), false)
    } catch (error) {
      throw toTmPoseError(error, 'POSE_ESTIMATION_FAILED')
    }

    let rawPredictions: Awaited<ReturnType<CustomPoseNet['predict']>>
    try {
      rawPredictions = await this.model.predict(estimate.posenetOutput)
    } catch (error) {
      throw toTmPoseError(error, 'PREDICTION_FAILED')
    }

    if (rawPredictions.length !== TM_POSE_LABELS.length) {
      throw new TmPoseError('MODEL_OUTPUT_MISMATCH', '모델 예측 결과가 네 클래스를 모두 포함하지 않습니다.')
    }
    const probabilities = createEmptyProbabilities()
    const seen = new Set<string>()
    for (const prediction of rawPredictions) {
      if (!TM_POSE_LABELS.includes(prediction.className as TmPoseLabel)) {
        throw new TmPoseError('LABEL_NAME_MISMATCH', `예상하지 못한 클래스: ${prediction.className}`)
      }
      seen.add(prediction.className)
      probabilities[prediction.className as TmPoseLabel] = clampProbability(prediction.probability)
    }
    if (seen.size !== TM_POSE_LABELS.length) {
      throw new TmPoseError('MODEL_OUTPUT_MISMATCH', '일부 클래스의 확률이 누락되었습니다.')
    }

    const sortedProbabilities = TM_POSE_LABELS.map((label) => ({
      label,
      probability: probabilities[label],
    })).sort((left, right) => right.probability - left.probability)
    const available = poseIsAvailable(estimate.pose)
    const best = sortedProbabilities[0]
    return {
      available,
      confidence: available ? best.probability : 0,
      inferenceMs: Math.max(0, this.now() - startedAt),
      modelVersion: TM_POSE_MODEL_CONFIG.version,
      poseScore: typeof estimate.pose?.score === 'number' ? estimate.pose.score : null,
      probabilities,
      runtimeStrategy: this.runtime.strategy,
      sortedProbabilities,
      timestampMs: input.timestampMs,
      topLabel: available ? best.label : null,
    }
  }

  getStatus(): TmPoseEngineStatus {
    return this.status
  }

  getModelInfo(): TmPoseModelInfo | null {
    return this.modelInfo
  }

  getInputCanvas(): HTMLCanvasElement {
    return this.inputAdapter.getCanvas()
  }

  async dispose(): Promise<void> {
    if (this.status === 'DISPOSED') return
    this.setStatus('DISPOSING')
    this.generation += 1
    try {
      this.disposeModel(this.model)
    } finally {
      this.model = null
      this.runtime = null
      this.metadata = null
      this.inputAdapter.dispose()
      this.runtimeLoader.dispose()
      this.setStatus('DISPOSED')
    }
  }

  private async initializeInternal(): Promise<void> {
    const generation = this.generation
    this.setStatus('LOADING_RUNTIME')
    const runtime = await this.runtimeLoader.initialize()
    this.assertCurrent(generation)

    this.setStatus('LOADING_METADATA')
    const metadataUrl = withModelVersion(TM_POSE_MODEL_CONFIG.metadataUrl)
    const metadata = await this.validator.loadMetadata(metadataUrl, this.fetcher)
    this.assertCurrent(generation)

    this.setStatus('LOADING_MODEL')
    let model: CustomPoseNet
    try {
      model = await runtime.loadModel(withModelVersion(TM_POSE_MODEL_CONFIG.modelUrl), metadata)
    } catch (error) {
      throw toTmPoseError(error, 'MODEL_LOAD_FAILED', TM_POSE_MODEL_CONFIG.modelUrl)
    }
    if (generation !== this.generation || this.status === 'DISPOSED') {
      this.disposeModel(model)
      throw new TmPoseError('RUNTIME_DISPOSED', '모델 초기화가 취소되었습니다.')
    }

    this.setStatus('VALIDATING_MODEL')
    if (model.getTotalClasses() !== TM_POSE_MODEL_CONFIG.expectedLabels.length) {
      this.disposeModel(model)
      throw new TmPoseError('MODEL_OUTPUT_MISMATCH', '모델 출력 클래스 수가 4가 아닙니다.')
    }
    let labels: TmPoseLabel[]
    try {
      labels = this.validator.validateModelLabels(model.getClassLabels())
      const warmupCanvas = this.inputAdapter.getCanvas()
      const inputResolution = this.validator.resolveInputResolution(metadata)
      warmupCanvas.width = inputResolution
      warmupCanvas.height = inputResolution
      let warmupEstimate: Awaited<ReturnType<CustomPoseNet['estimatePose']>>
      try {
        warmupEstimate = await model.estimatePose(warmupCanvas, false)
      } catch (error) {
        throw toTmPoseError(error, 'POSE_ESTIMATION_FAILED')
      }
      let warmupPredictions: Awaited<ReturnType<CustomPoseNet['predict']>>
      try {
        warmupPredictions = await model.predict(warmupEstimate.posenetOutput)
      } catch (error) {
        throw toTmPoseError(error, 'PREDICTION_FAILED')
      }
      this.validator.validateModelLabels(warmupPredictions.map((item) => item.className))
    } catch (error) {
      this.disposeModel(model)
      throw toTmPoseError(error, 'MODEL_OUTPUT_MISMATCH')
    }
    this.runtime = runtime
    this.metadata = metadata
    this.model = model
    this.modelInfo = {
      inputResolution: this.validator.resolveInputResolution(metadata),
      isPilotModel: true,
      labels,
      modelName: metadata.modelName ?? null,
      modelVersion: TM_POSE_MODEL_CONFIG.version,
      runtimeStrategy: runtime.strategy,
      tfjsVersion: runtime.tfjsVersion,
      tmPoseVersion: runtime.tmPoseVersion,
      trainedAt: metadata.timeStamp ?? null,
    }
    this.setStatus('READY')
  }

  private setStatus(status: TmPoseEngineStatus): void {
    this.status = status
    this.onStatusChange?.(status)
  }

  private disposeModel(model: CustomPoseNet | null): void {
    if (!model) return
    model.model.dispose()
    model.dispose()
  }

  private assertCurrent(generation: number): void {
    if (generation !== this.generation || this.status === 'DISPOSED') {
      throw new TmPoseError('RUNTIME_DISPOSED', '모델 초기화가 취소되었습니다.')
    }
  }
}
