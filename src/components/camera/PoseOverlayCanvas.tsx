import { useEffect, useRef } from 'react'

import { MediaPipePoseEngine } from '@/ai/MediaPipePoseEngine'
import type { PoseFrameResult } from '@/ai/pose-types'
import { isLandmarkReliable } from '@/ai/pose-validation'
import { computeContainTransform } from '@/components/camera/overlay-transform'
import { cn } from '@/lib/utils'

interface PoseOverlayCanvasProps {
  mirror: boolean
  subscribeFrame: (subscriber: (frame: PoseFrameResult | null) => void) => () => void
  visible: boolean
}

export function PoseOverlayCanvas({
  mirror,
  subscribeFrame,
  visible,
}: PoseOverlayCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameRef = useRef<PoseFrameResult | null>(null)
  const sizeRef = useRef({ height: 0, width: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    const wrapper = canvas?.parentElement
    if (!canvas || !wrapper) return

    const resize = () => {
      const { height, width } = wrapper.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      sizeRef.current = { height, width }
      const nextWidth = Math.max(1, Math.round(width * dpr))
      const nextHeight = Math.max(1, Math.round(height * dpr))
      if (canvas.width !== nextWidth) canvas.width = nextWidth
      if (canvas.height !== nextHeight) canvas.height = nextHeight
    }
    const observer = new ResizeObserver(resize)
    observer.observe(wrapper)
    resize()
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const draw = (frame: PoseFrameResult | null) => {
      frameRef.current = frame
      const canvas = canvasRef.current
      if (!canvas) return
      const context = canvas.getContext('2d')
      if (!context) return
      const dpr = window.devicePixelRatio || 1
      const { height, width } = sizeRef.current
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.clearRect(0, 0, width, height)
      if (!visible || !frame?.detected) return

      const transform = computeContainTransform(
        frame.sourceWidth,
        frame.sourceHeight,
        width,
        height,
      )
      const point = (index: number) => {
        const landmark = frame.landmarks[index]
        return landmark
          ? {
              landmark,
              x: transform.offsetX + landmark.x * transform.renderedWidth,
              y: transform.offsetY + landmark.y * transform.renderedHeight,
            }
          : null
      }

      context.lineCap = 'round'
      context.lineJoin = 'round'
      context.lineWidth = 2
      context.strokeStyle = 'rgba(129, 140, 248, 0.82)'
      for (const connection of MediaPipePoseEngine.connections) {
        const start = point(connection.start)
        const end = point(connection.end)
        if (!start || !end || !isLandmarkReliable(start.landmark) || !isLandmarkReliable(end.landmark)) continue
        context.beginPath()
        context.moveTo(start.x, start.y)
        context.lineTo(end.x, end.y)
        context.stroke()
      }

      for (let index = 0; index < frame.landmarks.length; index += 1) {
        const mapped = point(index)
        if (!mapped || !isLandmarkReliable(mapped.landmark)) continue
        context.beginPath()
        context.arc(mapped.x, mapped.y, 3, 0, Math.PI * 2)
        context.fillStyle = 'rgba(52, 211, 153, 0.92)'
        context.fill()
        context.lineWidth = 1
        context.strokeStyle = 'rgba(15, 23, 42, 0.65)'
        context.stroke()
      }
    }

    const unsubscribe = subscribeFrame(draw)
    draw(frameRef.current)
    return unsubscribe
  }, [subscribeFrame, visible])

  return (
    <canvas
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 size-full transition-transform duration-200',
        mirror && '-scale-x-100',
      )}
      ref={canvasRef}
    />
  )
}
