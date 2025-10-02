import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'mainImage',
      title: 'Main image',
      type: 'image',
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
      name: 'excerpt',
      title: 'Page Excerpt',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.max(200),
      description: 'Brief description of the page for SEO and previews',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'blockContent',
    }),
    defineField({
      name: 'showInNavigation',
      title: 'Show in Navigation',
      type: 'boolean',
      description: 'Display this page in the main navigation menu',
      initialValue: false,
    }),
    defineField({
      name: 'navigationOrder',
      title: 'Navigation Order',
      type: 'number',
      description: 'Order in navigation menu (lower numbers appear first)',
      hidden: ({document}) => !document?.showInNavigation,
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
      media: 'mainImage',
      showInNav: 'showInNavigation',
    },
    prepare(selection) {
      const {title, showInNav} = selection
      return {
        ...selection,
        subtitle: showInNav ? 'In Navigation' : 'Standalone Page',
      }
    },
  },
})
