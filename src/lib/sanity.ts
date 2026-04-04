import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import { EBIRD_BIRDING_QUERY } from './queries'
import type { EbirdBirding, SanityImage } from './types'

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
 * Birding singleton: bypass Sanity CDN and Next fetch cache so Studio toggles
 * (e.g. life list source) apply on the next request in production.
 */
export async function fetchEbirdBirdingConfig(): Promise<EbirdBirding | null> {
  try {
    return await sanityClient.fetch<EbirdBirding | null>(
      EBIRD_BIRDING_QUERY,
      {},
      {
        useCdn: false,
        cache: 'no-store',
      }
    )
  } catch (e) {
    console.error('eBird birding config fetch failed:', e)
    return null
  }
}

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
