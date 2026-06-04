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
      type: 'creditedImage',
      description: 'Image for social media sharing',
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
      title: 'Hide from search engines',
      type: 'boolean',
      options: {
        layout: 'switch',
      },
      description:
        'When ON, this page will not appear in Google and other search engines (noindex). Leave OFF for normal public pages. Use ON for drafts, private, or internal-only content.',
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
