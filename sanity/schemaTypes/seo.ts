import {defineField, defineType} from 'sanity'

export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Meta Title',
      type: 'string',
      validation: (Rule) => Rule.max(60).warning('Meta titles should be under 60 characters'),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.max(160).warning('Meta descriptions should be under 160 characters'),
    }),
    defineField({
      name: 'openGraphImage',
      title: 'Open Graph Image',
      type: 'image',
      description: 'Image for social media sharing',
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
        },
        {
          name: 'credit',
          type: 'string',
          title: 'Photo Credit',
          description: 'Credit the photographer (auto-populated for Unsplash images)',
        },
      ],
    }),
    defineField({
      name: 'keywords',
      title: 'Keywords',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'noIndex',
      title: 'Search Engine Visibility',
      type: 'string',
      options: {
        list: [
          {title: 'Show in search results', value: 'false'},
          {title: 'Hide from search results', value: 'true'},
        ],
        layout: 'radio',
      },
      description: 'Choose whether this page should appear in Google and other search engines. Hide pages that are private, drafts, or not meant for public discovery.',
      initialValue: 'false',
    }),
  ],
  preview: {
    select: {
      title: 'metaTitle',
      description: 'metaDescription',
    },
    prepare(selection) {
      const {title, description} = selection
      return {
        title: title || 'No meta title',
        subtitle: description || 'No meta description',
      }
    },
  },
})
