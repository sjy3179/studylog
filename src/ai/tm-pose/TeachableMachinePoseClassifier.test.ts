import type { CustomPoseNet } from '@teachablemachine/pose'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TeachableMachinePoseClassifier } from '@/ai/tm-pose/TeachableMachinePoseClassifier'
import { TmPoseInputAdapter } from '@/ai/tm-pose/TmPoseInputAdapter'
import { TmPoseRuntimeLoader } from '@/ai/tm-pose/TmPoseRuntimeLoader'
import type { TmPoseRuntime } from '@/ai/tm-pose/tm-pose-types'
import { TM_POSE_LABELS } from '@/types/study'

const metadata = {
  labels: [...TM_POSE_LABELS],
  modelName: 'my-pose-model',
  modelSettings: { posenet: { inputResolution: 257 } },
  timeStamp: '2026-07-11T19:21:19.496Z',
}

function createCanvasAdapter() {
  const context = {
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    restore: vi.fn(),
    save: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
  }
  const canvas = {
    getContext: vi.fn().mockReturnValue(context),
    height: 0,
    width: 0,
  } as unknown as HTMLCanvasElement
  return new TmPoseInputAdapter(() => canvas)
}

function predictions() {
  return [
    { className: 'RESTING', probability: 0.05 },
    { className: 'SIDE_LEAN', probability: 0.1 },
    { className: 'GOOD_POSTURE', probability: 0.8 },
    { className: 'FORWARD_LEAN', probability: 0.05 },
  ]
}

function createModel(overrides: Partial<CustomPoseNet> = {}) {
  return {
    dispose: vi.fn(),
    estimatePose: vi.fn().mockResolvedValue({
      pose: {
        keypoints: [{ part: 'nose', position: { x: 1, y: 1 }, score: 0.9 }],
        score: 0.9,
      },
      posenetOutput: new Float32Array([1, 2, 3]),
    }),
    getClassLabels: vi.fn().mockReturnValue([...TM_POSE_LABELS]),
    getTotalClasses: vi.fn().mockReturnValue(4),
    model: { dispose: vi.fn() },
    predict: vi.fn().mockResolvedValue(predictions()),
    ...overrides,
  } as unknown as CustomPoseNet
}

function createVideo() {
  return {
    readyState: HTMLMediaElement.HAVE_CURRENT_DATA,
    videoHeight: 720,
    videoWidth: 1280,
  } as HTMLVideoElement
}

function setup(model = createModel()) {
  const loadModel = vi.fn().mockResolvedValue(model)
  const runtime = {
    backend: 'webgl',
    loadModel,
    strategy: 'NPM_ESM',
    tf: {},
    tfjsVersion: '1.3.1',
    tmPose: { version: '0.8.6' },
    tmPoseVersion: '0.8.6',
  } as unknown as TmPoseRuntime
  const runtimeLoader = new TmPoseRuntimeLoader()
  vi.spyOn(runtimeLoader, 'initialize').mockResolvedValue(runtime)
  const fetcher = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(metadata), { headers: { 'Content-Type': 'application/json' } }),
  ) as unknown as typeof fetch
  const now = vi.fn().mockReturnValueOnce(10).mockReturnValue(35)
  const classifier = new TeachableMachinePoseClassifier({
    fetcher,
    inputAdapter: createCanvasAdapter(),
    now,
    runtimeLoader,
  })
  return { classifier, fetcher, loadModel, model }
}

describe('TeachableMachinePoseClassifier', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('deduplicates initialize and loads metadata before the model completes', async () => {
    const { classifier, fetcher, loadModel } = setup()
    await Promise.all([classifier.initialize(), classifier.initialize()])
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(loadModel).toHaveBeenCalledTimes(1)
    expect(classifier.getStatus()).toBe('READY')
  })

  it('calls estimatePose before predict and normalizes by className', async () => {
    const { classifier, model } = setup()
    await classifier.initialize()
    const result = await classifier.predict({ mirrorCamera: true, timestampMs: 100, video: createVideo() })
    expect(vi.mocked(model.estimatePose).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(model.predict).mock.invocationCallOrder[0],
    )
    expect(result.topLabel).toBe('GOOD_POSTURE')
    expect(result.probabilities.GOOD_POSTURE).toBe(0.8)
    expect(result.runtimeStrategy).toBe('NPM_ESM')
  })

  it('returns unavailable when pose confidence is too low', async () => {
    const model = createModel({
      estimatePose: vi.fn().mockResolvedValue({
        pose: { keypoints: [], score: 0.1 },
        posenetOutput: new Float32Array([1]),
      }),
    })
    const { classifier } = setup(model)
    await classifier.initialize()
    const result = await classifier.predict({ mirrorCamera: false, timestampMs: 1, video: createVideo() })
    expect(result.available).toBe(false)
    expect(result.topLabel).toBeNull()
    expect(result.confidence).toBe(0)
  })

  it('converts predict failures to a typed error', async () => {
    const model = createModel({
      predict: vi.fn().mockResolvedValueOnce(predictions()).mockRejectedValue(new Error('predict failed')),
    })
    const { classifier } = setup(model)
    await classifier.initialize()
    await expect(
      classifier.predict({ mirrorCamera: false, timestampMs: 1, video: createVideo() }),
    ).rejects.toMatchObject({ code: 'PREDICTION_FAILED' })
  })

  it('rejects a model class mismatch during initialize', async () => {
    const model = createModel({ getTotalClasses: vi.fn().mockReturnValue(3) })
    const { classifier } = setup(model)
    await expect(classifier.initialize()).rejects.toMatchObject({ code: 'MODEL_OUTPUT_MISMATCH' })
    expect(classifier.getStatus()).toBe('ERROR')
  })

  it('disposes the loaded model', async () => {
    const { classifier, model } = setup()
    await classifier.initialize()
    await classifier.dispose()
    expect(model.dispose).toHaveBeenCalledTimes(1)
    expect(classifier.getStatus()).toBe('DISPOSED')
  })

  it('blocks prediction after dispose', async () => {
    const { classifier } = setup()
    await classifier.initialize()
    await classifier.dispose()
    await expect(
      classifier.predict({ mirrorCamera: false, timestampMs: 1, video: createVideo() }),
    ).rejects.toMatchObject({ code: 'RUNTIME_DISPOSED' })
  })
})
