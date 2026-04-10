/**
 * Design token catalog for Storybook (Foundations/Design Tokens).
 *
 * **Source of truth:** `tokens/*.json` (Style Dictionary) → `src/styles/generated/tokens.css`.
 * Run `npm run tokens:build` after editing JSON.
 */
import colorSource from '../../tokens/color.json'
import fontSource from '../../tokens/font.json'
import {walkDtcgLeaves} from '@/lib/tokens/walkJsonTokens'

const colorLeaves = walkDtcgLeaves(colorSource)
const fontLeaves = walkDtcgLeaves(fontSource)

/** All leaf tokens from JSON sources (paths + values + optional descriptions). */
export const allJsonTokenLeaves = [...colorLeaves, ...fontLeaves]

/**
 * Maps token path (e.g. `color.background`) to the CSS custom property name Style Dictionary
 * generates (`--color-background`). Same rules as SD `name/kebab` on the full path.
 */
export function tokenPathToCssVar(path: string): string {
  return `--${path.replace(/\./g, '-')}`
}

/** Curated highlights for the “CSS variables” intro table. */
export const cssCustomProperties = [
  {
    name: tokenPathToCssVar('font.work-sans'),
    value: (fontSource as {font: {'work-sans': {$value: string}}}).font['work-sans'].$value,
    description: 'Primary UI font',
  },
  {
    name: tokenPathToCssVar('color.background'),
    value: (colorSource as {color: {background: {$value: string}}}).color.background.$value,
    description: 'Default page background',
  },
  {
    name: tokenPathToCssVar('color.link'),
    value: (colorSource as {color: {link: {$value: string}}}).color.link.$value,
    description: 'Default anchor color',
  },
] as const

/** Tailwind extended palette (matches `tailwind.config.js` → CSS variables). */
export const tailwindExtendedColors = [
  {token: 'custom-50', hex: colorSource.color.custom['50'].$value},
  {token: 'custom-100', hex: colorSource.color.custom['100'].$value},
  {token: 'custom-200', hex: colorSource.color.custom['200'].$value},
  {token: 'custom-300', hex: colorSource.color.custom['300'].$value},
  {token: 'custom-400', hex: colorSource.color.custom['400'].$value},
  {token: 'custom-500', hex: colorSource.color.custom['500'].$value},
  {token: 'custom-600', hex: colorSource.color.custom['600'].$value},
  {token: 'custom-700', hex: colorSource.color.custom['700'].$value},
  {token: 'custom-800', hex: colorSource.color.custom['800'].$value},
  {token: 'custom-900', hex: colorSource.color.custom['900'].$value},
  {token: 'page-bg', hex: colorSource.color['page-bg'].$value},
  {token: 'section-bg', hex: colorSource.color['section-bg'].$value},
  {token: 'card-bg', hex: colorSource.color['card-bg'].$value},
] as const

/** Semantic background helpers from `globals.css` */
export const semanticBackgroundClasses = [
  {className: 'bg-custom', note: 'Maps to `custom-200`'},
  {className: 'bg-custom-light', note: 'Maps to `section-bg`'},
  {className: 'bg-custom-dark', note: 'Maps to `custom-300`'},
  {className: 'bg-page', note: 'Maps to `page-bg`'},
  {className: 'bg-section', note: 'Maps to `section-bg`'},
  {className: 'bg-card', note: 'Maps to `card-bg`'},
] as const

/** Documented colors in `tokens/color.json` under `documented.*` */
const doc = colorSource.color.documented
export const documentedHexInGlobals = [
  {label: 'Body text', hex: doc.body.$value},
  {label: 'Prose body', hex: doc['prose-body'].$value},
  {label: 'Prose heading', hex: doc['prose-heading'].$value},
  {label: 'Selection bg', hex: doc['selection-bg'].$value},
  {label: 'Selection text', hex: doc['selection-fg'].$value},
] as const

/** Representative Tailwind spacing scale (default theme) */
export const spacingSteps = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24] as const

/** Tailwind font-size utilities used across the site */
export const typeScaleSteps = [
  'text-xs',
  'text-sm',
  'text-base',
  'text-lg',
  'text-xl',
  'text-2xl',
  'text-3xl',
  'text-4xl',
] as const
