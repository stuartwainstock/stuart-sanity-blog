import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'imageWithAlt',
  title: 'Image with Alt Text',
  type: 'image',
  options: {
    hotspot: true,
  },
  fields: [
    {
      name: 'alt',
      type: 'string',
      title: 'Alternative Text',
      description: 'Describe the image for screen readers. This is required for accessibility.',
      validation: (Rule) => 
        Rule.required()
          .min(10)
          .max(125)
          .warning('Alt text should be 10-125 characters for optimal accessibility'),
      options: {
        isHighlighted: true,
      },
    },
    {
      name: 'caption',
      type: 'string',
      title: 'Caption',
      description: 'Optional caption that will be displayed below the image',
    },
    {
      name: 'credit',
      type: 'string',
      title: 'Photo Credit',
      description: 'Credit the photographer (auto-populated for Unsplash images)',
    },
  ],
  preview: {
    select: {
      title: 'alt',
      media: 'asset',
      subtitle: 'credit',
    },
    prepare(selection) {
      const {title, media, subtitle} = selection
      return {
        title: title || 'Image without alt text',
        media,
        subtitle: subtitle ? `Photo by ${subtitle}` : 'No credit',
      }
    },
  },
})
