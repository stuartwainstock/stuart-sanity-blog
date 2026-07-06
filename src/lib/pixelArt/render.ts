import {
  GAMEBOY_PALETTE,
  NES_PALETTE,
  nearestPaletteColor,
  posterizeChannel,
  toGrayscale,
  type PaletteId,
} from '@/lib/pixelArt/palettes'

/** Longest edge a source image is scaled to before pixelating (perf + sane download size). */
export const MAX_WORKING_DIMENSION = 1400

export type PixelArtOptions = {
  /** Size, in source pixels, of one pixel-art block. */
  pixelSize: number
  paletteId: PaletteId
  /** Posterize levels per channel; only used by 'original' and 'grayscale' palettes. */
  colorLevels: number
  showGrid: boolean
}

/**
 * Loads a File/Blob into a canvas capped at MAX_WORKING_DIMENSION on the long edge.
 * Caller owns revoking any object URL passed in as `src`.
 */
export function loadImageIntoCanvas(
  src: string,
  options?: {crossOrigin?: 'anonymous'},
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (options?.crossOrigin) img.crossOrigin = options.crossOrigin
    img.onload = () => {
      const scale = Math.min(1, MAX_WORKING_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight))
      const width = Math.max(1, Math.round(img.naturalWidth * scale))
      const height = Math.max(1, Math.round(img.naturalHeight * scale))
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas 2D context is not available in this browser.'))
        return
      }
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      try {
        ctx.drawImage(img, 0, 0, width, height)
      } catch (e) {
        reject(e instanceof Error ? e : new Error('Failed to draw the image.'))
        return
      }
      resolve(canvas)
    }
    img.onerror = () => reject(new Error('Could not load that image.'))
    img.src = src
  })
}

/**
 * Downsamples `source` to a small grid (averaging colors per block), applies the
 * selected palette/posterize treatment, then scales back up with nearest-neighbor
 * for crisp blocky pixels. Draws the result into `outputCanvas`.
 *
 * Throws (SecurityError) if `source` is cross-origin without CORS — callers should
 * catch this and show a friendly message.
 */
export function drawPixelArt(
  source: HTMLCanvasElement,
  outputCanvas: HTMLCanvasElement,
  options: PixelArtOptions,
): void {
  const {pixelSize, paletteId, colorLevels, showGrid} = options
  const sourceWidth = source.width
  const sourceHeight = source.height
  const safePixelSize = Math.max(1, Math.round(pixelSize))
  const smallW = Math.max(1, Math.round(sourceWidth / safePixelSize))
  const smallH = Math.max(1, Math.round(sourceHeight / safePixelSize))

  const smallCanvas = document.createElement('canvas')
  smallCanvas.width = smallW
  smallCanvas.height = smallH
  const smallCtx = smallCanvas.getContext('2d')
  if (!smallCtx) throw new Error('Canvas 2D context is not available in this browser.')
  smallCtx.imageSmoothingEnabled = true
  smallCtx.imageSmoothingQuality = 'high'
  smallCtx.drawImage(source, 0, 0, smallW, smallH)

  const imageData = smallCtx.getImageData(0, 0, smallW, smallH)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]!
    let g = data[i + 1]!
    let b = data[i + 2]!

    if (paletteId === 'grayscale') {
      const gray = posterizeChannel(toGrayscale(r, g, b), colorLevels)
      r = g = b = gray
    } else if (paletteId === 'gameboy') {
      const gray = toGrayscale(r, g, b)
      ;[r, g, b] = nearestPaletteColor(gray, gray, gray, GAMEBOY_PALETTE)
    } else if (paletteId === 'nes') {
      ;[r, g, b] = nearestPaletteColor(r, g, b, NES_PALETTE)
    } else {
      r = posterizeChannel(r, colorLevels)
      g = posterizeChannel(g, colorLevels)
      b = posterizeChannel(b, colorLevels)
    }

    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
  }
  smallCtx.putImageData(imageData, 0, 0)

  outputCanvas.width = sourceWidth
  outputCanvas.height = sourceHeight
  const outCtx = outputCanvas.getContext('2d')
  if (!outCtx) throw new Error('Canvas 2D context is not available in this browser.')
  outCtx.imageSmoothingEnabled = false
  outCtx.clearRect(0, 0, sourceWidth, sourceHeight)
  outCtx.drawImage(smallCanvas, 0, 0, smallW, smallH, 0, 0, sourceWidth, sourceHeight)

  if (showGrid && smallW > 1 && smallH > 1) {
    outCtx.strokeStyle = 'rgba(0, 0, 0, 0.15)'
    outCtx.lineWidth = 1
    outCtx.beginPath()
    for (let x = 1; x < smallW; x++) {
      const px = Math.round((x / smallW) * sourceWidth) + 0.5
      outCtx.moveTo(px, 0)
      outCtx.lineTo(px, sourceHeight)
    }
    for (let y = 1; y < smallH; y++) {
      const py = Math.round((y / smallH) * sourceHeight) + 0.5
      outCtx.moveTo(0, py)
      outCtx.lineTo(sourceWidth, py)
    }
    outCtx.stroke()
  }
}
