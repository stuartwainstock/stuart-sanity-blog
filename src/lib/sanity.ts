import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import { SanityImage } from './types'

export const config = {
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ojv692hs',
  apiVersion: '2023-05-03',
  useCdn: process.env.NODE_ENV === 'production',
}

export const sanityClient = createClient(config)
const builder = imageUrlBuilder(sanityClient)

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
    
    return imageBuilder.url()
  } catch (error) {
    console.error('Error generating image URL:', error)
    return '/placeholder-image.jpg' // Fallback image
  }
}
