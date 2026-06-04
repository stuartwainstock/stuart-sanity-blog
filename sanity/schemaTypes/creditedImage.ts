import {ImageIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'
import type {FieldDefinition} from 'sanity'
import {ImageWithUnsplashCreditInput} from '../components/ImageWithUnsplashCreditInput'

export const unsplashCreditImageInput = ImageWithUnsplashCreditInput

/** Shared alt/caption/credit fields for image and creditedImage types. */
export const creditedImageFields: FieldDefinition[] = [
  defineField({
    name: 'alt',
    type: 'string',
    title: 'Alternative Text',
    description: 'Describe the image for screen readers. This is required for accessibility.',
    validation: (Rule) =>
      Rule.required()
        .min(10)
        .max(125)
        .warning('Alt text should be 10-125 characters for optimal accessibility'),
  }),
  defineField({
    name: 'caption',
    type: 'string',
    title: 'Caption',
    description: 'Optional caption that will be displayed below the image',
  }),
  defineField({
    name: 'credit',
    type: 'string',
    title: 'Photo Credit',
    description: 'Credit the photographer (auto-populated for Unsplash images)',
  }),
]

/** Image with alt/caption/credit; syncs Photo Credit when selected via Unsplash asset source. */
export const creditedImage = defineType({
  name: 'creditedImage',
  title: 'Image',
  type: 'image',
  icon: ImageIcon,
  components: {
    input: unsplashCreditImageInput,
  },
  options: {
    hotspot: true,
  },
  fields: creditedImageFields,
})
