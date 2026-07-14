import type {EmotionAxes} from './catalog'

/** 0 = subdued · 50 = catalog default · 100 = max expression */
export const INTENSITY_DEFAULT = 50
export const INTENSITY_MIN = 0
export const INTENSITY_MAX = 100

export type ResolvedIntensityAxes = EmotionAxes & {
  /** Multiplier on hero / alt glyph size (1 = catalog). */
  glyphScale: number
  /** Gap between type-scale rows in rem. */
  scaleGapRem: number
}

function parseTrackingEm(tracking: string): number {
  const match = tracking.trim().match(/^(-?[\d.]+)em$/i)
  if (!match) return 0
  return Number.parseFloat(match[1]!) || 0
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Remap catalog axes by intensity without changing the font set.
 * Midpoint (50) ≈ catalog values; higher tightens and amplifies expression.
 */
export function applyIntensity(base: EmotionAxes, intensity: number): ResolvedIntensityAxes {
  const t = clamp(intensity, INTENSITY_MIN, INTENSITY_MAX) / INTENSITY_MAX
  /** -1 at 0 · 0 at 50 · +1 at 100 */
  const delta = (t - 0.5) * 2

  const baseTrack = parseTrackingEm(base.tracking)
  const trackBias = Math.abs(baseTrack) < 0.008 ? 0.045 : Math.sign(baseTrack) * 0.055
  const trackingEm = clamp(baseTrack + delta * trackBias, -0.06, 0.14)

  const leading = clamp(base.leading - delta * 0.28, 1.05, 1.8)

  let transform: EmotionAxes['transform'] = base.transform
  if (base.transform === 'uppercase') {
    transform = intensity >= 20 ? 'uppercase' : 'none'
  } else {
    transform = intensity >= 88 ? 'uppercase' : 'none'
  }

  return {
    tracking: `${Number(trackingEm.toFixed(3))}em`,
    leading: Number(leading.toFixed(3)),
    transform,
    glyphScale: Number((0.82 + t * 0.42).toFixed(3)),
    scaleGapRem: Number((0.95 - t * 0.45).toFixed(3)),
  }
}

export function intensityLabel(intensity: number): string {
  if (intensity <= 20) return 'Subdued'
  if (intensity <= 40) return 'Soft'
  if (intensity <= 60) return 'Balanced'
  if (intensity <= 80) return 'Strong'
  return 'Max'
}
