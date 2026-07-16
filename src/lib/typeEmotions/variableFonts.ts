/**
 * Variable Google Font registry for the Type Emotions playground.
 * Keys must match CSS vars set in `src/app/type-emotions/fonts.ts`.
 *
 * Kitchen-sink axis sets: every non-wght axis next/font exposes for these faces.
 */

export type VariableFontKey =
  | 'fraunces'
  | 'recursive'
  | 'robotoFlex'
  | 'bricolage'
  | 'anybody'
  | 'nabla'
  | 'shantell'
  | 'workbench'

export type AxisDef = {
  /** OpenType axis tag (e.g. `wght`, `SOFT`). */
  tag: string
  /** Human-readable slider label. */
  label: string
  min: number
  max: number
  step: number
  default: number
  /** Optional grouping for denser slider UIs. */
  group?: 'core' | 'parametric' | 'expression'
}

export type VariableFontEntry = {
  key: VariableFontKey
  label: string
  /** CSS custom property from next/font (without `var()`). */
  cssVar: string
  /** Explicit stack — variable axes disable next/font auto-fallback. */
  fallback: string
  category: 'serif' | 'sans' | 'display' | 'mono' | 'experimental'
  supportsItalic?: boolean
  axes: readonly AxisDef[]
}

export type AxisCoord = Record<string, number>

export const VARIABLE_FONTS: Record<VariableFontKey, VariableFontEntry> = {
  fraunces: {
    key: 'fraunces',
    label: 'Fraunces',
    cssVar: '--font-specimen-fraunces',
    fallback: 'Georgia, "Times New Roman", serif',
    category: 'serif',
    supportsItalic: true,
    axes: [
      {tag: 'wght', label: 'Weight', min: 100, max: 900, step: 1, default: 400, group: 'core'},
      {tag: 'opsz', label: 'Optical size', min: 9, max: 144, step: 1, default: 36, group: 'core'},
      {tag: 'SOFT', label: 'Softness', min: 0, max: 100, step: 1, default: 0, group: 'expression'},
      {tag: 'WONK', label: 'Wonk', min: 0, max: 1, step: 1, default: 0, group: 'expression'},
    ],
  },
  recursive: {
    key: 'recursive',
    label: 'Recursive',
    cssVar: '--font-specimen-recursive',
    fallback: 'ui-monospace, Menlo, Monaco, Consolas, monospace',
    category: 'sans',
    axes: [
      {tag: 'wght', label: 'Weight', min: 300, max: 1000, step: 1, default: 400, group: 'core'},
      {tag: 'slnt', label: 'Slant', min: -15, max: 0, step: 0.5, default: 0, group: 'core'},
      {tag: 'CASL', label: 'Casual', min: 0, max: 1, step: 0.01, default: 0, group: 'expression'},
      {tag: 'CRSV', label: 'Cursive', min: 0, max: 1, step: 0.5, default: 0.5, group: 'expression'},
      {tag: 'MONO', label: 'Mono', min: 0, max: 1, step: 0.01, default: 0, group: 'expression'},
    ],
  },
  robotoFlex: {
    key: 'robotoFlex',
    label: 'Roboto Flex',
    cssVar: '--font-specimen-roboto-flex',
    fallback: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    category: 'sans',
    axes: [
      {tag: 'wght', label: 'Weight', min: 100, max: 1000, step: 1, default: 400, group: 'core'},
      {tag: 'wdth', label: 'Width', min: 25, max: 151, step: 1, default: 100, group: 'core'},
      {tag: 'opsz', label: 'Optical size', min: 8, max: 144, step: 1, default: 14, group: 'core'},
      {tag: 'GRAD', label: 'Grade', min: -200, max: 150, step: 1, default: 0, group: 'core'},
      {tag: 'slnt', label: 'Slant', min: -10, max: 0, step: 0.5, default: 0, group: 'core'},
      {tag: 'XOPQ', label: 'Stroke X', min: 27, max: 175, step: 1, default: 96, group: 'parametric'},
      {tag: 'YOPQ', label: 'Stroke Y', min: 25, max: 135, step: 1, default: 79, group: 'parametric'},
      {tag: 'XTRA', label: 'Counter', min: 323, max: 603, step: 1, default: 468, group: 'parametric'},
      {tag: 'YTUC', label: 'Caps height', min: 528, max: 760, step: 1, default: 712, group: 'parametric'},
      {tag: 'YTLC', label: 'Lowercase', min: 416, max: 570, step: 1, default: 514, group: 'parametric'},
      {tag: 'YTAS', label: 'Ascender', min: 649, max: 854, step: 1, default: 750, group: 'parametric'},
      {tag: 'YTDE', label: 'Descender', min: -305, max: -98, step: 1, default: -203, group: 'parametric'},
      {tag: 'YTFI', label: 'Figure height', min: 560, max: 788, step: 1, default: 738, group: 'parametric'},
    ],
  },
  bricolage: {
    key: 'bricolage',
    label: 'Bricolage Grotesque',
    cssVar: '--font-specimen-bricolage',
    fallback: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    category: 'display',
    axes: [
      {tag: 'wght', label: 'Weight', min: 200, max: 800, step: 1, default: 400, group: 'core'},
      {tag: 'wdth', label: 'Width', min: 75, max: 100, step: 1, default: 100, group: 'core'},
      {tag: 'opsz', label: 'Optical size', min: 12, max: 96, step: 1, default: 14, group: 'core'},
    ],
  },
  anybody: {
    key: 'anybody',
    label: 'Anybody',
    cssVar: '--font-specimen-anybody',
    fallback: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    category: 'display',
    supportsItalic: true,
    axes: [
      {tag: 'wght', label: 'Weight', min: 100, max: 900, step: 1, default: 400, group: 'core'},
      {tag: 'wdth', label: 'Width', min: 50, max: 150, step: 1, default: 100, group: 'core'},
    ],
  },
  nabla: {
    key: 'nabla',
    label: 'Nabla',
    cssVar: '--font-specimen-nabla',
    fallback: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    category: 'experimental',
    axes: [
      {tag: 'EDPT', label: 'Depth', min: 0, max: 200, step: 1, default: 100, group: 'expression'},
      {tag: 'EHLT', label: 'Highlight', min: 0, max: 24, step: 1, default: 12, group: 'expression'},
    ],
  },
  shantell: {
    key: 'shantell',
    label: 'Shantell Sans',
    cssVar: '--font-specimen-shantell',
    fallback: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    category: 'experimental',
    supportsItalic: true,
    axes: [
      {tag: 'wght', label: 'Weight', min: 300, max: 800, step: 1, default: 400, group: 'core'},
      {tag: 'BNCE', label: 'Bounce', min: -100, max: 100, step: 1, default: 0, group: 'expression'},
      {tag: 'INFM', label: 'Informality', min: 0, max: 100, step: 1, default: 0, group: 'expression'},
      {tag: 'SPAC', label: 'Spacing', min: 0, max: 100, step: 1, default: 0, group: 'expression'},
    ],
  },
  workbench: {
    key: 'workbench',
    label: 'Workbench',
    cssVar: '--font-specimen-workbench',
    fallback: 'ui-monospace, Menlo, Monaco, Consolas, monospace',
    category: 'experimental',
    axes: [
      {tag: 'BLED', label: 'Bleed', min: 0, max: 100, step: 1, default: 0, group: 'expression'},
      {tag: 'SCAN', label: 'Scanlines', min: -53, max: 100, step: 1, default: 0, group: 'expression'},
    ],
  },
}

export const VARIABLE_FONT_KEYS = Object.keys(VARIABLE_FONTS) as VariableFontKey[]

/** Always-available experimental faces for the kitchen-sink playground. */
export const LAB_FONT_KEYS: VariableFontKey[] = ['nabla', 'shantell', 'workbench']

export const AXIS_GROUP_ORDER = ['core', 'parametric', 'expression'] as const

export const AXIS_GROUP_LABEL: Record<(typeof AXIS_GROUP_ORDER)[number], string> = {
  core: 'Core',
  parametric: 'Parametric',
  expression: 'Expression',
}

/** Runtime registry — hydrated from Sanity when available, else static defaults. */
let runtimeFonts: Record<VariableFontKey, VariableFontEntry> = VARIABLE_FONTS

export function hydrateVariableFonts(fonts: VariableFontEntry[]): void {
  const next = {...VARIABLE_FONTS}
  for (const font of fonts) {
    next[font.key] = font
  }
  runtimeFonts = next
}

export function getVariableFont(key: VariableFontKey): VariableFontEntry {
  return runtimeFonts[key] ?? VARIABLE_FONTS[key]
}

/** Defaults for every axis of a font (used when switching fonts without an emotion preset). */
export function defaultAxisCoord(key: VariableFontKey): AxisCoord {
  const font = getVariableFont(key)
  const coord: AxisCoord = {}
  for (const axis of font.axes) {
    coord[axis.tag] = axis.default
  }
  return coord
}

/** Clamp each axis value to the font's declared range. */
export function clampAxisCoord(key: VariableFontKey, coord: AxisCoord): AxisCoord {
  const font = getVariableFont(key)
  const out: AxisCoord = {}
  for (const axis of font.axes) {
    const raw = coord[axis.tag]
    const value = typeof raw === 'number' ? raw : axis.default
    out[axis.tag] = Math.min(axis.max, Math.max(axis.min, value))
  }
  return out
}

export function fontFamilyStack(key: VariableFontKey): string {
  const font = getVariableFont(key)
  return `var(${font.cssVar}), ${font.fallback}`
}
