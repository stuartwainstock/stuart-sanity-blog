import type {SpecimenFamilyKey} from '@/lib/typeEmotions/catalog'

/**
 * CSS custom properties set by `next/font` in `fonts.ts` (server-only).
 * Client components must use these vars — never import `fonts.ts` into a client module.
 */
export const SPECIMEN_FONT_VARS: Record<SpecimenFamilyKey, string> = {
  cormorantGaramond: 'var(--font-specimen-cormorant)',
  libreBaskerville: 'var(--font-specimen-libre-baskerville)',
  lora: 'var(--font-specimen-lora)',
  oswald: 'var(--font-specimen-oswald)',
  bebasNeue: 'var(--font-specimen-bebas)',
  anton: 'var(--font-specimen-anton)',
  fredoka: 'var(--font-specimen-fredoka)',
  nunito: 'var(--font-specimen-nunito)',
  comfortaa: 'var(--font-specimen-comfortaa)',
  playfairDisplay: 'var(--font-specimen-playfair)',
  fraunces: 'var(--font-specimen-fraunces)',
  merriweather: 'var(--font-specimen-merriweather)',
  ibmPlexSans: 'var(--font-specimen-ibm-plex)',
  inter: 'var(--font-specimen-inter)',
  spaceGrotesk: 'var(--font-specimen-space-grotesk)',
  specialElite: 'var(--font-specimen-special-elite)',
  ebGaramond: 'var(--font-specimen-eb-garamond)',
  archivoBlack: 'var(--font-specimen-archivo-black)',
  barlowCondensed: 'var(--font-specimen-barlow-condensed)',
  syne: 'var(--font-specimen-syne)',
  jetbrainsMono: 'var(--font-specimen-jetbrains)',
  greatVibes: 'var(--font-specimen-great-vibes)',
}
