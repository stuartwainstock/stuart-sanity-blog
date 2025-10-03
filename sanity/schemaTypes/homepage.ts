import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      description: 'The main title for the homepage',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'hero',
      title: 'Hero Section',
      type: 'object',
      fields: [
        defineField({
          name: 'title',
          title: 'Hero Title',
          type: 'string',
          description: 'The main headline on the homepage',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'subtitle',
          title: 'Hero Subtitle',
          type: 'text',
          description: 'The subtitle text below the main title',
          rows: 3,
        }),
        defineField({
          name: 'primaryButton',
          title: 'Primary Button',
          type: 'object',
          fields: [
            defineField({
              name: 'text',
              title: 'Button Text',
              type: 'string',
            }),
            defineField({
              name: 'url',
              title: 'Button URL',
              type: 'string',
            }),
          ],
        }),
        defineField({
          name: 'secondaryButton',
          title: 'Secondary Button',
          type: 'object',
          fields: [
            defineField({
              name: 'text',
              title: 'Button Text',
              type: 'string',
            }),
            defineField({
              name: 'url',
              title: 'Button URL',
              type: 'string',
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'featuredSection',
      title: 'Featured Posts Section',
      type: 'object',
      fields: [
        defineField({
          name: 'title',
          title: 'Section Title',
          type: 'string',
          initialValue: 'Featured Posts',
        }),
        defineField({
          name: 'subtitle',
          title: 'Section Subtitle',
          type: 'text',
          rows: 2,
        }),
      ],
    }),
    defineField({
      name: 'recentSection',
      title: 'Recent Posts Section',
      type: 'object',
      fields: [
        defineField({
          name: 'title',
          title: 'Section Title',
          type: 'string',
          initialValue: 'Recent Posts',
        }),
        defineField({
          name: 'subtitle',
          title: 'Section Subtitle',
          type: 'text',
          rows: 2,
        }),
      ],
    }),
    defineField({
      name: 'ctaSection',
      title: 'Call to Action Section',
      type: 'object',
      fields: [
        defineField({
          name: 'title',
          title: 'CTA Title',
          type: 'string',
        }),
        defineField({
          name: 'subtitle',
          title: 'CTA Subtitle',
          type: 'text',
          rows: 2,
        }),
        defineField({
          name: 'buttonText',
          title: 'Button Text',
          type: 'string',
        }),
        defineField({
          name: 'buttonUrl',
          title: 'Button URL',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'hero.title',
    },
    prepare(selection) {
      const { title, subtitle } = selection
      return {
        title: title || 'Homepage',
        subtitle: subtitle || 'No hero title set',
      }
    },
  },
})
