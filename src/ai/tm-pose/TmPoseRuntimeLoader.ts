import { TM_POSE_MODEL_CONFIG, withModelVersion } from '@/ai/tm-pose/tm-pose-config'
import { TmPoseError } from '@/ai/tm-pose/tm-pose-errors'
import type { TmPoseRuntime, TmPoseRuntimeStrategy } from '@/ai/tm-pose/tm-pose-types'

export class TmPoseRuntimeLoader {
  private initializePromise: Promise<TmPoseRuntime> | null = null
  private runtime: TmPoseRuntime | null = null

  initialize(): Promise<TmPoseRuntime> {
    if (this.runtime) return Promise.resolve(this.runtime)
    if (this.initializePromise) return this.initializePromise
    this.initializePromise = this.load().finally(() => {
      this.initializePromise = null
    })
    return this.initializePromise
  }

  isReady(): boolean {
    return this.runtime !== null
  }

  getStrategy(): TmPoseRuntimeStrategy | null {
    return this.runtime?.strategy ?? null
  }

  getRuntime(): TmPoseRuntime | null {
    return this.runtime
  }

  dispose(): void {
    this.runtime = null
    this.initializePromise = null
  }

  private async load(): Promise<TmPoseRuntime> {
    try {
      const [tf, tmPose, poseNet] = await Promise.all([
        import('@tensorflow/tfjs'),
        import('@teachablemachine/pose'),
        import('@tensorflow-models/posenet'),
      ])
      await tf.ready()
      if (typeof tmPose.load !== 'function') {
        throw new Error('Teachable Machine Pose load 함수를 찾지 못했습니다.')
      }
      this.runtime = {
        backend: tf.getBackend(),
        loadModel: async (modelUrl, metadata) => {
          const classifierModel = await tf.loadLayersModel(modelUrl)
          let poseNetModel: Awaited<ReturnType<typeof poseNet.load>>
          try {
            const settings = metadata.modelSettings?.posenet ?? {}
            poseNetModel = await poseNet.load({
              architecture: 'MobileNetV1',
              inputResolution: settings.inputResolution ?? 257,
              modelUrl: withModelVersion(TM_POSE_MODEL_CONFIG.poseNetModelUrl),
              multiplier: 0.75,
              outputStride: 16,
              quantBytes: 4,
            })
          } catch (error) {
            classifierModel.dispose()
            throw error
          }
          return new tmPose.CustomPoseNet(classifierModel, poseNetModel, metadata)
        },
        strategy: 'NPM_ESM',
        tf,
        tfjsVersion: tf.version.tfjs,
        tmPose,
        tmPoseVersion: tmPose.version,
      }
      return this.runtime
    } catch (error) {
      throw new TmPoseError(
        'RUNTIME_LOAD_FAILED',
        error instanceof Error ? error.message : 'TM Pose 런타임을 불러오지 못했습니다.',
      )
    }
  }
}
