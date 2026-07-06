/** RGB triple, 0–255 per channel. */
export type RGB = readonly [number, number, number]

export type PaletteId = 'original' | 'grayscale' | 'gameboy' | 'nes'

export type PaletteOption = {
  id: PaletteId
  label: string
  /** Whether the "color levels" slider applies to this palette. */
  usesColorLevels: boolean
}

export const PALETTE_OPTIONS: PaletteOption[] = [
  {id: 'original', label: 'Original colors', usesColorLevels: true},
  {id: 'grayscale', label: 'Grayscale', usesColorLevels: true},
  {id: 'gameboy', label: 'Game Boy', usesColorLevels: false},
  {id: 'nes', label: '8-bit', usesColorLevels: false},
]

/** Classic 4-shade Game Boy green palette. */
export const GAMEBOY_PALETTE: RGB[] = [
  [15, 56, 15],
  [48, 98, 48],
  [139, 172, 15],
  [155, 188, 15],
]

/** A curated ~16-color retro console-style palette (not a literal hardware palette). */
export const NES_PALETTE: RGB[] = [
  [0, 0, 0],
  [255, 255, 255],
  [188, 188, 188],
  [124, 124, 124],
  [172, 0, 0],
  [228, 0, 88],
  [248, 120, 88],
  [252, 160, 68],
  [216, 168, 0],
  [0, 120, 0],
  [0, 168, 0],
  [0, 232, 216],
  [0, 88, 248],
  [104, 68, 252],
  [216, 0, 204],
  [88, 88, 88],
]

/** Round a single channel value to the nearest of `levels` evenly-spaced steps. */
export function posterizeChannel(value: number, levels: number): number {
  if (levels <= 1) return 0
  const step = 255 / (levels - 1)
  return Math.min(255, Math.max(0, Math.round(Math.round(value / step) * step)))
}

/** Rec. 601 luma — perceptually reasonable grayscale conversion. */
export function toGrayscale(r: number, g: number, b: number): number {
  return Math.round(0.299 * r + 0.587 * g + 0.114 * b)
}

/** Nearest palette color by squared Euclidean RGB distance. */
export function nearestPaletteColor(r: number, g: number, b: number, palette: RGB[]): RGB {
  let best = palette[0]!
  let bestDist = Infinity
  for (const c of palette) {
    const dr = r - c[0]
    const dg = g - c[1]
    const db = b - c[2]
    const dist = dr * dr + dg * dg + db * db
    if (dist < bestDist) {
      bestDist = dist
      best = c
    }
  }
  return best
}
