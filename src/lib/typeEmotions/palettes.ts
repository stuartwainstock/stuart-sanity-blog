/**
 * Curated Coolors palettes for specimen chrome.
 * Prefer Coolors URLs (`https://coolors.co/hex-hex-…`) — no live Coolors API.
 *
 * Role colors may include WCAG-adjusted tints of Coolors swatches so body/meta
 * text hits AA (4.5:1) on the specimen ground. Original swatches stay in `swatches`.
 */

export type SpecimenPaletteId =
  | 'candy-pop'
  | 'fiery-ocean'
  | 'magenta-dream'
  | 'neutral-elegance'

export type SpecimenPaletteRoles = {
  bg: string
  fg: string
  muted: string
  line: string
  accent: string
  chipBg: string
  chipSelectedBg: string
  chipSelectedFg: string
}

export type SpecimenPalette = {
  id: SpecimenPaletteId
  name: string
  /** Canonical Coolors generator / share URL. */
  coolorsUrl: string
  /** Original Coolors swatch order (no #); length 1–10. */
  swatches: readonly string[]
  /** Mapped into specimen CSS custom properties. */
  roles: SpecimenPaletteRoles
  intensityHigh?: Partial<SpecimenPaletteRoles>
  intensityMax?: Partial<SpecimenPaletteRoles>
}

/**
 * Candy Pop — lush violets, electric pinks, zingy turquoise.
 * @see https://coolors.co/9b5de5-f15bb5-fee440-00bbf9-00f5d4
 */
export const CANDY_POP: SpecimenPalette = {
  id: 'candy-pop',
  name: 'Candy Pop',
  coolorsUrl: 'https://coolors.co/9b5de5-f15bb5-fee440-00bbf9-00f5d4',
  swatches: ['9B5DE5', 'F15BB5', 'FEE440', '00BBF9', '00F5D4'],
  roles: {
    bg: '#FEE440',
    // Deepened lavender (from #9B5DE5) for AA on banana cream
    fg: '#5B2A9A',
    muted: '#4A2080',
    line: '#00BBF9',
    // Pink fails on yellow — use deep violet for accent text; pink stays in swatches
    accent: '#5B2A9A',
    chipBg: '#00BBF9',
    chipSelectedBg: '#5B2A9A',
    chipSelectedFg: '#FEE440',
  },
  intensityHigh: {
    bg: '#F5D628',
    muted: '#3B1568',
    accent: '#3B1568',
  },
  intensityMax: {
    bg: '#F0C820',
    fg: '#2E0F52',
    muted: '#2E0F52',
    accent: '#2E0F52',
  },
}

/**
 * Fiery Ocean — molten crimson, flag red, papaya, deep navy, steel blue.
 * @see https://coolors.co/780000-c1121f-fdf0d5-003049-669bbc
 */
export const FIERY_OCEAN: SpecimenPalette = {
  id: 'fiery-ocean',
  name: 'Fiery Ocean',
  coolorsUrl: 'https://coolors.co/780000-c1121f-fdf0d5-003049-669bbc',
  swatches: ['780000', 'C1121F', 'FDF0D5', '003049', '669BBC'],
  roles: {
    bg: '#003049',
    fg: '#FDF0D5',
    muted: '#669BBC',
    line: '#669BBC',
    // Flag red fails on navy — steel blue is the AA-safe accent on this ground
    accent: '#669BBC',
    chipBg: '#780000',
    chipSelectedBg: '#C1121F',
    chipSelectedFg: '#FDF0D5',
  },
  intensityHigh: {
    bg: '#00263A',
    muted: '#7AADCA',
    line: '#7AADCA',
    accent: '#7AADCA',
  },
  intensityMax: {
    bg: '#780000',
    fg: '#FDF0D5',
    muted: '#FDF0D5',
    line: '#C1121F',
    accent: '#FDF0D5',
    chipBg: '#003049',
    chipSelectedBg: '#FDF0D5',
    chipSelectedFg: '#780000',
  },
}

/**
 * Magenta Dream — raspberry → plum → dusk → aqua twilight spectrum.
 * Body/meta use light tints of pacific cyan so type stays AA on grape/dusk grounds.
 * @see https://coolors.co/d7094c-aa1a50-8b2864-723c70-5c4d7d-455e8b-2e6f8e-1780a1-0d91ad
 */
export const MAGENTA_DREAM: SpecimenPalette = {
  id: 'magenta-dream',
  name: 'Magenta Dream',
  coolorsUrl:
    'https://coolors.co/d7094c-aa1a50-8b2864-723c70-5c4d7d-455e8b-2e6f8e-1780a1-0d91ad',
  swatches: [
    'D7094C',
    'AA1A50',
    '8B2864',
    '723C70',
    '5C4D7D',
    '455E8B',
    '2E6F8E',
    '1780A1',
    '0D91AD',
  ],
  roles: {
    bg: '#5C4D7D',
    // Tint of #0D91AD — raw cyan-on-grape was ~2:1
    fg: '#E8F7FA',
    muted: '#B8DDE6',
    line: '#455E8B',
    accent: '#E8F7FA',
    chipBg: '#723C70',
    chipSelectedBg: '#D7094C',
    chipSelectedFg: '#E8F7FA',
  },
  intensityHigh: {
    bg: '#455E8B',
    fg: '#E8F7FA',
    muted: '#C5E4EB',
    accent: '#E8F7FA',
  },
  intensityMax: {
    bg: '#723C70',
    fg: '#E8F7FA',
    muted: '#C5E4EB',
    line: '#8B2864',
    accent: '#E8F7FA',
    chipBg: '#AA1A50',
    chipSelectedBg: '#D7094C',
    chipSelectedFg: '#E8F7FA',
  },
}

/**
 * Neutral Elegance — taupe, grey olive, silver, parchment, powder blush.
 * @see https://coolors.co/463f3a-8a817c-bcb8b1-f4f3ee-e0afa0
 */
export const NEUTRAL_ELEGANCE: SpecimenPalette = {
  id: 'neutral-elegance',
  name: 'Neutral Elegance',
  coolorsUrl: 'https://coolors.co/463f3a-8a817c-bcb8b1-f4f3ee-e0afa0',
  swatches: ['463F3A', '8A817C', 'BCB8B1', 'F4F3EE', 'E0AFA0'],
  roles: {
    bg: '#F4F3EE',
    fg: '#463F3A',
    // Grey olive #8A817C is ~3.4:1 — deepen for AA meta text
    muted: '#5C5650',
    line: '#BCB8B1',
    // Blush fails on parchment — taupe for accent text; blush remains in swatches
    accent: '#463F3A',
    chipBg: '#BCB8B1',
    chipSelectedBg: '#463F3A',
    chipSelectedFg: '#F4F3EE',
  },
  intensityHigh: {
    bg: '#EFECE5',
    muted: '#5C5650',
    line: '#B0ABA3',
    accent: '#463F3A',
  },
  intensityMax: {
    bg: '#E8E4DC',
    fg: '#3A342F',
    muted: '#3A342F',
    accent: '#3A342F',
  },
}

export const SPECIMEN_PALETTES: Record<SpecimenPaletteId, SpecimenPalette> = {
  'candy-pop': CANDY_POP,
  'fiery-ocean': FIERY_OCEAN,
  'magenta-dream': MAGENTA_DREAM,
  'neutral-elegance': NEUTRAL_ELEGANCE,
}

export function resolvePaletteRoles(
  palette: SpecimenPalette,
  intensity: number,
): SpecimenPaletteRoles {
  const base = palette.roles
  if (intensity >= 85 && palette.intensityMax) {
    return {...base, ...palette.intensityMax}
  }
  if (intensity >= 65 && palette.intensityHigh) {
    return {...base, ...palette.intensityHigh}
  }
  return base
}

export function paletteToCssVars(roles: SpecimenPaletteRoles): Record<string, string> {
  return {
    '--specimen-bg': roles.bg,
    '--specimen-fg': roles.fg,
    '--specimen-muted': roles.muted,
    '--specimen-line': roles.line,
    '--specimen-accent': roles.accent,
    '--specimen-chip-bg': roles.chipBg,
    '--specimen-chip-selected-bg': roles.chipSelectedBg,
    '--specimen-chip-selected-fg': roles.chipSelectedFg,
  }
}
