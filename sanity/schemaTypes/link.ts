import { defineField, defineType } from 'sanity'

export const link = defineType({
  name: 'link',
  title: 'Links',
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
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'url',
    },
  },
})
