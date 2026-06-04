import { getImageUrl } from '@/lib/sanity'
import type { SanityImage } from '@/lib/types'

export type SanityImageDimensions = {
  width: number
  height: number
}

/** Max width for embedded images in blog post body (~56rem content column). */
export const PORTABLE_TEXT_IMAGE_MAX_WIDTH = 960

export function getSanityAssetDimensions(image: SanityImage): SanityImageDimensions | null {
  const dims = image.asset?.metadata?.dimensions
  if (!dims?.width || !dims?.height) {
    return null
  }
  return { width: dims.width, height: dims.height }
}

export function scaleDimensions(
  intrinsic: SanityImageDimensions,
  maxWidth: number,
): SanityImageDimensions {
  if (intrinsic.width <= maxWidth) {
    return intrinsic
  }
  const ratio = maxWidth / intrinsic.width
  return {
    width: maxWidth,
    height: Math.round(intrinsic.height * ratio),
  }
}

/**
 * Build a Next.js Image-friendly src and intrinsic display size that preserves aspect ratio.
 * Falls back to a 16:9 box when Sanity metadata is missing (legacy uploads).
 */
export function getSanityImageDisplay(
  image: SanityImage,
  maxWidth: number,
): { src: string; width: number; height: number } {
  const intrinsic = getSanityAssetDimensions(image)
  const { width, height } = intrinsic
    ? scaleDimensions(intrinsic, maxWidth)
    : { width: maxWidth, height: Math.round((maxWidth * 9) / 16) }

  return {
    src: getImageUrl(image, width),
    width,
    height,
  }
}
