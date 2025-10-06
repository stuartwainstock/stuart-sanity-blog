import {defineField, defineType} from 'sanity'
import {SettingsIcon} from '@sanity/icons'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  icon: SettingsIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Site Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Site Description',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'journalDescription',
      title: 'Journal Description',
      type: 'text',
      rows: 3,
      description: 'Description text that appears on the journal page',
      validation: (Rule) => Rule.max(200).warning('Keep it concise for better readability'),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
          description: 'Describe the logo for screen readers. This is required for accessibility.',
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
      name: 'favicon',
      title: 'Favicon',
      type: 'image',
      description: 'Upload a square image (32x32px recommended)',
    }),
    defineField({
      name: 'url',
      title: 'Site URL',
      type: 'url',
      description: 'The main URL for your site',
    }),
    defineField({
      name: 'social',
      title: 'Social Media',
      type: 'object',
      fields: [
        {
          name: 'twitter',
          title: 'Twitter',
          type: 'string',
        },
        {
          name: 'facebook',
          title: 'Facebook',
          type: 'string',
        },
        {
          name: 'instagram',
          title: 'Instagram',
          type: 'string',
        },
        {
          name: 'linkedin',
          title: 'LinkedIn',
          type: 'string',
        },
        {
          name: 'github',
          title: 'GitHub',
          type: 'string',
        },
      ],
    }),
    defineField({
      name: 'footer',
      title: 'Footer',
      type: 'object',
      fields: [
        {
          name: 'copyright',
          title: 'Copyright Text',
          type: 'string',
        },
        {
          name: 'links',
          title: 'Footer Links',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'title',
                  title: 'Title',
                  type: 'string',
                },
                {
                  name: 'url',
                  title: 'URL',
                  type: 'string',
                },
              ],
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'seo',
      title: 'Default SEO',
      type: 'seo',
      description: 'Default SEO settings for the site',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'logo',
    },
  },
})
