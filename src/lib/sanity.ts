import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import { SanityImage } from './types'

export const config = {
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ojv692hs', // Use your actual project ID as fallback
  apiVersion: '2023-05-03',
  useCdn: process.env.NODE_ENV === 'production',
}

// Set up the client for fetching data in the getProps page functions
export const sanityClient = createClient(config)

// Set up a helper function for generating Image URLs with only the asset reference data in your documents.
const builder = imageUrlBuilder(sanityClient)

export const urlFor = (source: SanityImage) => {
  return builder.image(source)
}

// Helper function to get image URL with dimensions
export const getImageUrl = (source: SanityImage, width?: number, height?: number) => {
  let imageBuilder = urlFor(source)
  
  if (width) {
    imageBuilder = imageBuilder.width(width)
  }
  
  if (height) {
    imageBuilder = imageBuilder.height(height)
  }
  
  return imageBuilder.url()
}
