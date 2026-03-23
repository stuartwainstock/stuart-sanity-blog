import { defineField, defineType } from 'sanity'

export const resource = defineType({
  name: 'resource',
  title: 'Resources',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: (Rule) => Rule.required().uri({ allowRelative: false }),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'image',
      title: 'Open Graph Image URL',
      type: 'url',
      validation: (Rule) => Rule.uri({ allowRelative: false }),
    }),
    defineField({
      name: 'addedDate',
      title: 'Added Date',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'status',
      title: 'Workflow Status',
      type: 'string',
      options: {
        list: [
          { title: 'Inbox', value: 'inbox' },
          { title: 'Reviewed', value: 'reviewed' },
          { title: 'Published', value: 'published' },
          { title: 'Rejected', value: 'rejected' },
        ],
        layout: 'radio',
      },
      initialValue: 'inbox',
      validation: (Rule) => Rule.required(),
      description: 'Rejected items are queued for deletion in the Rejected view.',
    }),
    defineField({
      name: 'mediaType',
      title: 'Media Type',
      type: 'string',
      options: {
        list: [
          { title: 'Article', value: 'article' },
          { title: 'Book', value: 'book' },
          { title: 'Video', value: 'video' },
          { title: 'Podcast', value: 'podcast' },
          { title: 'Tool', value: 'tool' },
          { title: 'Other', value: 'other' },
        ],
        layout: 'dropdown',
      },
      initialValue: 'article',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'sourceDomain',
      title: 'Source Domain',
      type: 'string',
      readOnly: true,
      description: 'Auto-populated from the URL hostname.',
    }),
    defineField({
      name: 'normalizedUrl',
      title: 'Normalized URL',
      type: 'string',
      hidden: true,
      readOnly: true,
      description: 'Internal canonical URL used for deduplication.',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'sourceDomain',
      mediaType: 'mediaType',
      status: 'status',
    },
    prepare(selection) {
      const { title, subtitle, mediaType, status } = selection as {
        title?: string
        subtitle?: string
        mediaType?: string
        status?: string
      }
      const typePart = mediaType ? `[${mediaType}]` : '[resource]'
      const statusPart = status ? `• ${status}` : ''
      const domainPart = subtitle ? `• ${subtitle}` : ''

      return {
        title: title || 'Untitled resource',
        subtitle: `${typePart} ${statusPart} ${domainPart}`.trim(),
      }
    },
  },
})
