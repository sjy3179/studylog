export interface ContainTransform {
  scale: number
  offsetX: number
  offsetY: number
  renderedWidth: number
  renderedHeight: number
}

export function computeContainTransform(
  sourceWidth: number,
  sourceHeight: number,
  containerWidth: number,
  containerHeight: number,
): ContainTransform {
  if ([sourceWidth, sourceHeight, containerWidth, containerHeight].some((value) => value <= 0)) {
    return { scale: 0, offsetX: 0, offsetY: 0, renderedWidth: 0, renderedHeight: 0 }
  }
  const scale = Math.min(containerWidth / sourceWidth, containerHeight / sourceHeight)
  const renderedWidth = sourceWidth * scale
  const renderedHeight = sourceHeight * scale
  return {
    scale,
    offsetX: (containerWidth - renderedWidth) / 2,
    offsetY: (containerHeight - renderedHeight) / 2,
    renderedWidth,
    renderedHeight,
  }
}
