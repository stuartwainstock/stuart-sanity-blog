import type {EmotionEntry, EmotionSurface} from './catalog'
import type {SpecimenPalette, SpecimenPaletteId, SpecimenPaletteRoles} from './palettes'
import type {AxisCoord, AxisDef, VariableFontEntry, VariableFontKey} from './variableFonts'

export type SanityAxisTagValue = {
  tag?: string | null
  value?: number | null
}

export type SanityVariableFontFace = {
  _id: string
  key?: string | null
  label?: string | null
  cssVar?: string | null
  fallback?: string | null
  category?: VariableFontEntry['category'] | null
  italicSupport?: 'roman' | 'romanAndItalic' | null
  axes?: Array<{
    tag?: string | null
    label?: string | null
    min?: number | null
    max?: number | null
    step?: number | null
    default?: number | null
    group?: AxisDef['group'] | null
  }> | null
}

export type SanitySpecimenPalette = {
  _id: string
  key?: string | null
  label?: string | null
  sourceUrl?: string | null
  swatches?: string[] | null
  roles?: SpecimenPaletteRoles | null
  intensityHigh?: Partial<SpecimenPaletteRoles> | null
  intensityMax?: Partial<SpecimenPaletteRoles> | null
}

export type SanityTypeEmotion = {
  _id: string
  emotionId?: string | null
  label?: string | null
  synonyms?: string[] | null
  fontKey?: string | null
  alternateFontKeys?: string[] | null
  coordinate?: SanityAxisTagValue[] | null
  intense?: SanityAxisTagValue[] | null
  italic?: 'none' | 'italic' | null
  transform?: 'none' | 'uppercase' | null
  paletteKey?: string | null
  surface?: EmotionSurface | null
  specimenWord?: string | null
  reason?: string | null
}

function tagValueArrayToCoord(rows: SanityAxisTagValue[] | null | undefined): AxisCoord {
  const out: AxisCoord = {}
  for (const row of rows ?? []) {
    if (!row?.tag || typeof row.value !== 'number') continue
    out[row.tag] = row.value
  }
  return out
}

export function mapSanityFontFace(doc: SanityVariableFontFace): VariableFontEntry | null {
  if (!doc.key || !doc.label || !doc.cssVar) return null
  const key = doc.key as VariableFontKey
  const axes: AxisDef[] = (doc.axes ?? [])
    .filter((a): a is NonNullable<typeof a> => Boolean(a?.tag))
    .map((a) => ({
      tag: a.tag!,
      label: a.label ?? a.tag!,
      min: a.min ?? 0,
      max: a.max ?? 1000,
      step: a.step ?? 1,
      default: a.default ?? 400,
      group: a.group ?? 'core',
    }))

  return {
    key,
    label: doc.label,
    cssVar: doc.cssVar,
    fallback: doc.fallback ?? 'sans-serif',
    category: doc.category ?? 'sans',
    supportsItalic: doc.italicSupport === 'romanAndItalic',
    axes,
  }
}

export function mapSanityPalette(doc: SanitySpecimenPalette): SpecimenPalette | null {
  if (!doc.key || !doc.label || !doc.roles) return null
  return {
    id: doc.key as SpecimenPaletteId,
    name: doc.label,
    coolorsUrl: doc.sourceUrl ?? '',
    swatches: doc.swatches ?? [],
    roles: doc.roles,
    intensityHigh: doc.intensityHigh ?? undefined,
    intensityMax: doc.intensityMax ?? undefined,
  }
}

export function mapSanityEmotion(doc: SanityTypeEmotion): EmotionEntry | null {
  if (!doc.emotionId || !doc.label || !doc.fontKey) return null
  return {
    id: doc.emotionId as EmotionEntry['id'],
    label: doc.label,
    synonyms: doc.synonyms ?? [],
    fontKey: doc.fontKey as VariableFontKey,
    coordinate: tagValueArrayToCoord(doc.coordinate),
    intense: tagValueArrayToCoord(doc.intense),
    italic: doc.italic === 'italic',
    transform: doc.transform === 'uppercase' ? 'uppercase' : 'none',
    alternateFontKeys: (doc.alternateFontKeys ?? []).filter(Boolean) as VariableFontKey[],
    surface: doc.surface ?? 'light',
    paletteId: (doc.paletteKey as SpecimenPaletteId | undefined) || undefined,
    specimenWord: doc.specimenWord ?? doc.label,
    reason: doc.reason ?? '',
  }
}
