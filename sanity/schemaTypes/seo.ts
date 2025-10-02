import {defineField, defineType} from 'sanity'

export default defineType({
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
        }
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
      title: 'No Index',
      type: 'boolean',
      description: 'Prevent search engines from indexing this page',
      initialValue: false,
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
