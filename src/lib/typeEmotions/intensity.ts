import type {EmotionEntry} from './catalog'
import {
  clampAxisCoord,
  defaultAxisCoord,
  type AxisCoord,
  type VariableFontKey,
} from './variableFonts'

/** 0 = subdued · 50 = catalog featured · 100 = max expression */
export const INTENSITY_DEFAULT = 50
export const INTENSITY_MIN = 0
export const INTENSITY_MAX = 100

export type ResolvedPresentation = {
  axisValues: AxisCoord
  italic: boolean
  transform: 'none' | 'uppercase'
  tracking: string
  leading: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Subdued end (intensity 0): pull each featured axis halfway toward the font default.
 * Keeps the emotion recognizable without going flat.
 */
function subduedCoord(fontKey: VariableFontKey, featured: AxisCoord): AxisCoord {
  const defaults = defaultAxisCoord(fontKey)
  const out: AxisCoord = {}
  const tags = new Set([...Object.keys(featured), ...Object.keys(defaults)])
  for (const tag of tags) {
    const feat = featured[tag] ?? defaults[tag] ?? 0
    const def = defaults[tag] ?? feat
    out[tag] = lerp(feat, def, 0.55)
  }
  return clampAxisCoord(fontKey, out)
}

/**
 * Interpolate axis values for an emotion across intensity 0 → 50 → 100.
 * Midpoint (50) ≈ `entry.coordinate`; 100 ≈ `entry.intense`.
 */
export function resolveAxisValues(entry: EmotionEntry, intensity: number): AxisCoord {
  const t = clamp(intensity, INTENSITY_MIN, INTENSITY_MAX) / INTENSITY_MAX
  const featured = clampAxisCoord(entry.fontKey, entry.coordinate)
  const intense = clampAxisCoord(entry.fontKey, {...featured, ...entry.intense})
  const subdued = subduedCoord(entry.fontKey, featured)

  const out: AxisCoord = {}
  const tags = new Set([
    ...Object.keys(subdued),
    ...Object.keys(featured),
    ...Object.keys(intense),
  ])

  if (t <= 0.5) {
    const local = t / 0.5
    for (const tag of tags) {
      out[tag] = lerp(subdued[tag] ?? 0, featured[tag] ?? 0, local)
    }
  } else {
    const local = (t - 0.5) / 0.5
    for (const tag of tags) {
      out[tag] = lerp(featured[tag] ?? 0, intense[tag] ?? 0, local)
    }
  }

  return clampAxisCoord(entry.fontKey, out)
}

/** CSS `font-variation-settings` string from axis values. */
export function buildVariationSettings(axisValues: AxisCoord): string {
  return Object.entries(axisValues)
    .map(([tag, value]) => `"${tag}" ${Number(value.toFixed(3))}`)
    .join(', ')
}

/**
 * Full presentation for an emotion at a given intensity:
 * axis values + light CSS extras (tracking / leading / case).
 */
export function resolvePresentation(entry: EmotionEntry, intensity: number): ResolvedPresentation {
  const t = clamp(intensity, INTENSITY_MIN, INTENSITY_MAX) / INTENSITY_MAX
  const delta = (t - 0.5) * 2

  let transform: 'none' | 'uppercase' = entry.transform ?? 'none'
  if (entry.transform === 'uppercase') {
    transform = intensity >= 20 ? 'uppercase' : 'none'
  } else {
    transform = intensity >= 92 ? 'uppercase' : 'none'
  }

  const trackingEm = clamp(0.01 + delta * 0.035, -0.04, 0.1)
  const leading = clamp(1.35 - delta * 0.2, 1.05, 1.7)

  return {
    axisValues: resolveAxisValues(entry, intensity),
    italic: Boolean(entry.italic),
    transform,
    tracking: `${Number(trackingEm.toFixed(3))}em`,
    leading: Number(leading.toFixed(3)),
  }
}

export function intensityLabel(intensity: number): string {
  if (intensity <= 20) return 'Subdued'
  if (intensity <= 40) return 'Soft'
  if (intensity <= 60) return 'Balanced'
  if (intensity <= 80) return 'Strong'
  return 'Max'
}
