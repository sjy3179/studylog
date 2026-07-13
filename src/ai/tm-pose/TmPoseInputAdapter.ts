import { TM_POSE_INFERENCE_CONFIG } from '@/ai/tm-pose/tm-pose-config'
import { TmPoseError } from '@/ai/tm-pose/tm-pose-errors'
import type { TmPoseInputOptions } from '@/ai/tm-pose/tm-pose-types'

export interface CenterSquareCrop {
  size: number
  sourceX: number
  sourceY: number
}

export function computeCenterSquareCrop(width: number, height: number): CenterSquareCrop {
  if (width <= 0 || height <= 0) {
    throw new TmPoseError('INPUT_NOT_READY', '카메라 영상 크기가 아직 준비되지 않았습니다.')
  }
  const size = Math.min(width, height)
  return {
    size,
    sourceX: (width - size) / 2,
    sourceY: (height - size) / 2,
  }
}

export class TmPoseInputAdapter {
  private readonly canvas: HTMLCanvasElement
  private options: TmPoseInputOptions = {
    cropMode: 'CENTER_SQUARE',
    inputSize: TM_POSE_INFERENCE_CONFIG.defaultInputResolution,
    mirror: true,
  }

  constructor(canvasFactory: () => HTMLCanvasElement = () => document.createElement('canvas')) {
    this.canvas = canvasFactory()
  }

  configure(options: TmPoseInputOptions): void {
    this.options = options
  }

  capture(video: HTMLVideoElement): HTMLCanvasElement {
    const crop = computeCenterSquareCrop(video.videoWidth, video.videoHeight)
    const size = this.options.inputSize
    if (this.canvas.width !== size) this.canvas.width = size
    if (this.canvas.height !== size) this.canvas.height = size
    const context = this.canvas.getContext('2d')
    if (!context) throw new TmPoseError('INPUT_NOT_READY', '2D canvas를 만들지 못했습니다.')

    context.save()
    context.clearRect(0, 0, size, size)
    if (this.options.mirror) {
      context.translate(size, 0)
      context.scale(-1, 1)
    }
    context.drawImage(
      video,
      crop.sourceX,
      crop.sourceY,
      crop.size,
      crop.size,
      0,
      0,
      size,
      size,
    )
    context.restore()
    return this.canvas
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas
  }

  dispose(): void {
    this.canvas.width = 0
    this.canvas.height = 0
  }
}
