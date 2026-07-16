import {
  Anybody,
  Bricolage_Grotesque,
  Fraunces,
  Nabla,
  Recursive,
  Roboto_Flex,
  Shantell_Sans,
  Workbench,
} from 'next/font/google'

/**
 * Server-only: import from `page.tsx`, never from a `'use client'` module.
 * Client UI resolves faces via CSS vars in `src/lib/typeEmotions/variableFonts.ts`.
 *
 * Variable axes require omitting explicit `weight` (or `weight: 'variable'`).
 * Non-wght axes are listed in `axes`; values are set at runtime via
 * `font-variation-settings`.
 */

const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['opsz', 'SOFT', 'WONK'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-specimen-fraunces',
})

const recursive = Recursive({
  subsets: ['latin'],
  axes: ['slnt', 'CASL', 'CRSV', 'MONO'],
  display: 'swap',
  variable: '--font-specimen-recursive',
})

const robotoFlex = Roboto_Flex({
  subsets: ['latin'],
  axes: ['wdth', 'opsz', 'GRAD', 'slnt', 'XOPQ', 'YOPQ', 'XTRA', 'YTUC', 'YTLC', 'YTAS', 'YTDE', 'YTFI'],
  display: 'swap',
  variable: '--font-specimen-roboto-flex',
})

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  axes: ['wdth', 'opsz'],
  display: 'swap',
  variable: '--font-specimen-bricolage',
})

const anybody = Anybody({
  subsets: ['latin'],
  axes: ['wdth'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-specimen-anybody',
})

const nabla = Nabla({
  subsets: ['latin'],
  axes: ['EDPT', 'EHLT'],
  display: 'swap',
  variable: '--font-specimen-nabla',
})

const shantell = Shantell_Sans({
  subsets: ['latin'],
  axes: ['BNCE', 'INFM', 'SPAC'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-specimen-shantell',
})

const workbench = Workbench({
  subsets: ['latin'],
  axes: ['BLED', 'SCAN'],
  display: 'swap',
  variable: '--font-specimen-workbench',
})

/** Apply on a server-rendered wrapper so specimen CSS vars are available to the client studio. */
export const specimenFontVariablesClassName = [
  fraunces.variable,
  recursive.variable,
  robotoFlex.variable,
  bricolage.variable,
  anybody.variable,
  nabla.variable,
  shantell.variable,
  workbench.variable,
].join(' ')
