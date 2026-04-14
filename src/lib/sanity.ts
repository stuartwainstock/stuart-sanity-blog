import { cache } from 'react'
import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import {
  EBIRD_BIRDING_QUERY,
  TOOL_PROJECT_PAGE_FLIGHTS_QUERY,
  TOOL_PROJECT_PAGE_RUNS_QUERY,
} from './queries'
import type { EbirdBirding, SanityImage, ToolProjectPage } from './types'

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
const builder = imageUrlBuilder(sanityClient)

/**
 * Pileated Watch singleton: useCdn false + short Next revalidate so Studio
 * edits reach the site without waiting on the Sanity CDN.
 * Wrapped in cache() to dedupe between generateMetadata and page render.
 */
export const fetchEbirdBirdingConfig = cache(async (): Promise<EbirdBirding | null> => {
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
})

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
    
    if (width) {
      imageBuilder = imageBuilder.width(width)
    }
    
    if (height) {
      imageBuilder = imageBuilder.height(height)
    }
    
    // Add quality parameter for better optimization
    imageBuilder = imageBuilder.quality(85)
    
    const url = imageBuilder.url()
    return url
  } catch (error) {
    console.error('Error generating image URL:', error)
    return '/placeholder-image.jpg' // Fallback image
  }
}
