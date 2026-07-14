import {
  Anton,
  Archivo_Black,
  Barlow_Condensed,
  Bebas_Neue,
  Comfortaa,
  Cormorant_Garamond,
  EB_Garamond,
  Fraunces,
  Fredoka,
  Great_Vibes,
  IBM_Plex_Sans,
  Inter,
  JetBrains_Mono,
  Libre_Baskerville,
  Lora,
  Merriweather,
  Nunito,
  Oswald,
  Playfair_Display,
  Space_Grotesk,
  Special_Elite,
  Syne,
} from 'next/font/google'
/**
 * Server-only: import from `page.tsx`, never from a `'use client'` module.
 * Client UI resolves faces via CSS vars in `src/lib/typeEmotions/specimenFontVars.ts`.
 */

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-specimen-cormorant',
})

const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-specimen-libre-baskerville',
})

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-specimen-lora',
})

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-specimen-oswald',
})

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-specimen-bebas',
})

const anton = Anton({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-specimen-anton',
})

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-specimen-fredoka',
})

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-specimen-nunito',
})

const comfortaa = Comfortaa({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-specimen-comfortaa',
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-specimen-playfair',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-specimen-fraunces',
})

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-specimen-merriweather',
})

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-specimen-ibm-plex',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-specimen-inter',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-specimen-space-grotesk',
})

const specialElite = Special_Elite({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-specimen-special-elite',
})

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '600'],
  display: 'swap',
  variable: '--font-specimen-eb-garamond',
})

const archivoBlack = Archivo_Black({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-specimen-archivo-black',
})

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-specimen-barlow-condensed',
})

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-specimen-syne',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-specimen-jetbrains',
})

const greatVibes = Great_Vibes({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-specimen-great-vibes',
})

/** Apply on a server-rendered wrapper so specimen CSS vars are available to the client studio. */
export const specimenFontVariablesClassName = [
  cormorantGaramond.variable,
  libreBaskerville.variable,
  lora.variable,
  oswald.variable,
  bebasNeue.variable,
  anton.variable,
  fredoka.variable,
  nunito.variable,
  comfortaa.variable,
  playfairDisplay.variable,
  fraunces.variable,
  merriweather.variable,
  ibmPlexSans.variable,
  inter.variable,
  spaceGrotesk.variable,
  specialElite.variable,
  ebGaramond.variable,
  archivoBlack.variable,
  barlowCondensed.variable,
  syne.variable,
  jetbrainsMono.variable,
  greatVibes.variable,
].join(' ')
