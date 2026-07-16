import { cache } from 'react'
import { createClient } from 'next-sanity'
import { createImageUrlBuilder } from '@sanity/image-url'
import {
  CASE_STUDIES_QUERY,
  CASE_STUDY_META_QUERY,
  EBIRD_BIRDING_QUERY,
  LAB_HUB_QUERY,
  CASE_STUDIES_HUB_QUERY,
  TOOL_PROJECT_PAGE_BIRDING_QUERY,
  TOOL_PROJECT_PAGE_FLIGHTS_QUERY,
  TOOL_PROJECT_PAGE_RUNS_QUERY,
  TOOL_PROJECT_PAGE_TYPE_EMOTIONS_QUERY,
  TYPE_EMOTION_FONT_FACES_QUERY,
  TYPE_EMOTION_PALETTES_QUERY,
  TYPE_EMOTIONS_QUERY,
} from './queries'
import type {
  CaseStudyListItem,
  CaseStudyMeta,
  ContentHubConfig,
  EbirdBirding,
  LabHubConfig,
  SanityImage,
  ToolProjectPage,
} from './types'
import type {EmotionEntry} from './typeEmotions/catalog'
import type {SpecimenPalette} from './typeEmotions/palettes'
import type {VariableFontEntry} from './typeEmotions/variableFonts'
import type {
  SanitySpecimenPalette,
  SanityTypeEmotion,
  SanityVariableFontFace,
} from './typeEmotions/fromSanity'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET

if (!projectId || !dataset) {
  throw new Error(
    'Missing Sanity environment variables. Set NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET.'
  )
}

export const config = {
  dataset,
  projectId,
  apiVersion: '2023-05-03',
  useCdn: process.env.NODE_ENV === 'production', // Use CDN in production for better performance
}

export const sanityClient = createClient(config)
const builder = createImageUrlBuilder(sanityClient)

/**
 * Pileated Watch singleton: useCdn false + short Next revalidate so Studio
 * edits reach the site without waiting on the Sanity CDN.
 */
export async function fetchEbirdBirdingConfig(): Promise<EbirdBirding | null> {
  try {
    return await sanityClient.fetch<EbirdBirding | null>(
      EBIRD_BIRDING_QUERY,
      {},
      {
        useCdn: false,
        next: {revalidate: 60},
      }
    )
  } catch (e) {
    console.error('eBird birding config fetch failed:', e)
    return null
  }
}

/** Dedupes between `generateMetadata` and the page render. */
export const fetchToolProjectPageRuns = cache(async (): Promise<ToolProjectPage | null> => {
  try {
    return await sanityClient.fetch<ToolProjectPage | null>(
      TOOL_PROJECT_PAGE_RUNS_QUERY,
      {},
      {
        useCdn: false,
        next: {revalidate: 60},
      }
    )
  } catch (e) {
    console.error('tool project page (runs) fetch failed:', e)
    return null
  }
})

/** Dedupes between `generateMetadata` and the birding dashboard page render. */
export const fetchToolProjectPageBirding = cache(async (): Promise<ToolProjectPage | null> => {
  try {
    return await sanityClient.fetch<ToolProjectPage | null>(
      TOOL_PROJECT_PAGE_BIRDING_QUERY,
      {},
      {
        useCdn: false,
        next: {revalidate: 60},
      }
    )
  } catch (e) {
    console.error('tool project page (birding-dashboard) fetch failed:', e)
    return null
  }
})

/** Dedupes between `generateMetadata` and the flights page render. */
export const fetchToolProjectPageFlights = cache(async (): Promise<ToolProjectPage | null> => {
  try {
    return await sanityClient.fetch<ToolProjectPage | null>(
      TOOL_PROJECT_PAGE_FLIGHTS_QUERY,
      {},
      {
        useCdn: false,
        next: {revalidate: 60},
      }
    )
  } catch (e) {
    console.error('tool project page (flights) fetch failed:', e)
    return null
  }
})

/** Type Emotions — /type-emotions page chrome. */
export const fetchToolProjectPageTypeEmotions = cache(
  async (): Promise<ToolProjectPage | null> => {
    try {
      return await sanityClient.fetch<ToolProjectPage | null>(
        TOOL_PROJECT_PAGE_TYPE_EMOTIONS_QUERY,
        {},
        {
          useCdn: false,
          next: {revalidate: 60},
        },
      )
    } catch (e) {
      console.error('tool project page (type-emotions) fetch failed:', e)
      return null
    }
  },
)

export type TypeEmotionsBundle = {
  catalog: EmotionEntry[]
  palettes: Record<string, SpecimenPalette>
  fonts: VariableFontEntry[]
  page: ToolProjectPage | null
}

/** Emotions + palettes + font metadata for /type-emotions. Falls back to static modules. */
export const fetchTypeEmotionsBundle = cache(async (): Promise<TypeEmotionsBundle> => {
  const {EMOTION_CATALOG} = await import('./typeEmotions/catalog')
  const {SPECIMEN_PALETTES} = await import('./typeEmotions/palettes')
  const {VARIABLE_FONTS, hydrateVariableFonts} = await import('./typeEmotions/variableFonts')
  const {mapSanityEmotion, mapSanityFontFace, mapSanityPalette} = await import(
    './typeEmotions/fromSanity'
  )

  const empty: TypeEmotionsBundle = {
    catalog: EMOTION_CATALOG,
    palettes: SPECIMEN_PALETTES as Record<string, SpecimenPalette>,
    fonts: Object.values(VARIABLE_FONTS),
    page: null,
  }

  try {
    const [page, fontDocs, paletteDocs, emotionDocs] = await Promise.all([
      sanityClient.fetch<ToolProjectPage | null>(
        TOOL_PROJECT_PAGE_TYPE_EMOTIONS_QUERY,
        {},
        {useCdn: false, next: {revalidate: 60}},
      ),
      sanityClient.fetch<SanityVariableFontFace[]>(
        TYPE_EMOTION_FONT_FACES_QUERY,
        {},
        {useCdn: false, next: {revalidate: 60}},
      ),
      sanityClient.fetch<SanitySpecimenPalette[]>(
        TYPE_EMOTION_PALETTES_QUERY,
        {},
        {useCdn: false, next: {revalidate: 60}},
      ),
      sanityClient.fetch<SanityTypeEmotion[]>(
        TYPE_EMOTIONS_QUERY,
        {},
        {useCdn: false, next: {revalidate: 60}},
      ),
    ])

    const fonts = (fontDocs ?? [])
      .map(mapSanityFontFace)
      .filter((f): f is VariableFontEntry => Boolean(f))
    if (fonts.length > 0) hydrateVariableFonts(fonts)

    const palettes: Record<string, SpecimenPalette> = {}
    for (const doc of paletteDocs ?? []) {
      const mapped = mapSanityPalette(doc)
      if (mapped) palettes[mapped.id] = mapped
    }

    const catalog = (emotionDocs ?? [])
      .map(mapSanityEmotion)
      .filter((e): e is EmotionEntry => Boolean(e))

    return {
      catalog: catalog.length > 0 ? catalog : empty.catalog,
      palettes: Object.keys(palettes).length > 0 ? palettes : empty.palettes,
      fonts: fonts.length > 0 ? fonts : empty.fonts,
      page,
    }
  } catch (e) {
    console.error('type emotions bundle fetch failed:', e)
    return empty
  }
})

/** Lab hub page copy + project links. Dedupes generateMetadata + render. */
export const fetchLabHub = cache(async (): Promise<LabHubConfig | null> => {
  try {
    return await sanityClient.fetch<LabHubConfig | null>(
      LAB_HUB_QUERY,
      {},
      {
        useCdn: false,
        next: {revalidate: 60},
      }
    )
  } catch (e) {
    console.error('lab hub fetch failed:', e)
    return null
  }
})

/** Case studies hub page copy. Dedupes generateMetadata + render. */
export const fetchCaseStudiesHub = cache(async (): Promise<ContentHubConfig | null> => {
  try {
    return await sanityClient.fetch<ContentHubConfig | null>(
      CASE_STUDIES_HUB_QUERY,
      {},
      {
        useCdn: false,
        next: {revalidate: 60},
      }
    )
  } catch (e) {
    console.error('case studies hub fetch failed:', e)
    return null
  }
})

/** All case studies for the /case-studies listing. */
export async function fetchCaseStudies(): Promise<CaseStudyListItem[]> {
  try {
    return await sanityClient.fetch<CaseStudyListItem[]>(
      CASE_STUDIES_QUERY,
      {},
      {
        useCdn: false,
        next: {revalidate: 60},
      }
    )
  } catch (e) {
    console.error('case studies fetch failed:', e)
    return []
  }
}

/** Public gate-page copy for a single case study. Dedupes generateMetadata + render. */
export const fetchCaseStudyMeta = cache(async (slug: string): Promise<CaseStudyMeta | null> => {
  try {
    return await sanityClient.fetch<CaseStudyMeta | null>(
      CASE_STUDY_META_QUERY,
      {slug},
      {
        useCdn: false,
        next: {revalidate: 60},
      }
    )
  } catch (e) {
    console.error('case study meta fetch failed:', e)
    return null
  }
})

export const urlFor = (source: SanityImage) => {
  return builder.image(source)
}

export const getImageUrl = (source: SanityImage, width?: number, height?: number) => {
  if (!source || !source.asset) {
    console.warn('Invalid image source:', source)
    return '/placeholder-image.jpg' // Fallback image
  }

  try {
    let imageBuilder = urlFor(source)
    
    if (width && height) {
      imageBuilder = imageBuilder.width(width).height(height).fit('max')
    } else if (width) {
      imageBuilder = imageBuilder.width(width).fit('max')
    } else if (height) {
      imageBuilder = imageBuilder.height(height).fit('max')
    }

    imageBuilder = imageBuilder.auto('format').quality(85)
    
    const url = imageBuilder.url()
    return url
  } catch (error) {
    console.error('Error generating image URL:', error)
    return '/placeholder-image.jpg' // Fallback image
  }
}
