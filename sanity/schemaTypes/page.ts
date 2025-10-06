import {defineField, defineType} from 'sanity'
import BookSearchInput from '../components/BookSearchInput'

export const page = defineType({
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
          description: 'Describe the image for screen readers. This is required for accessibility.',
          validation: (Rule) => 
            Rule.required()
              .min(10)
              .max(125)
              .warning('Alt text should be 10-125 characters for optimal accessibility'),
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
      name: 'speakingEngagements',
      title: 'Speaking Engagements',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'engagement',
          title: 'Engagement',
          fields: [
            defineField({
              name: 'title',
              title: 'Event Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'date',
              title: 'Date',
              type: 'date',
              options: {
                dateFormat: 'YYYY-MM',
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'type',
              title: 'Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Speaking', value: 'speaking' },
                  { title: 'Writing', value: 'writing' },
                  { title: 'Interview', value: 'interview' },
                  { title: 'Podcast', value: 'podcast' },
                  { title: 'Workshop', value: 'workshop' },
                  { title: 'Conference', value: 'conference' },
                  { title: 'Blog', value: 'blog' },
                  { title: 'Article', value: 'article' },
                ],
                layout: 'dropdown',
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
              description: 'Link to the event, article, or external resource',
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 2,
              description: 'Optional additional details about the engagement',
            }),
          ],
          preview: {
            select: {
              title: 'title',
              type: 'type',
              date: 'date',
            },
            prepare(selection) {
              const { title, type, date } = selection
              const formattedDate = date ? new Date(date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long' 
              }) : 'No date'
              return {
                title: title || 'Untitled',
                subtitle: `${type} • ${formattedDate}`,
              }
            },
          },
        },
      ],
      description: 'Add speaking engagements, publications, interviews, and other professional activities',
    }),
    defineField({
      name: 'readingList',
      title: 'Reading List',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'book',
          title: 'Book',
          fields: [
            defineField({
              name: 'bookSearch',
              title: '🔍 Search Books',
              type: 'string',
              description: 'Search for books to auto-populate details',
              components: {
                input: BookSearchInput,
              },
            }),
            defineField({
              name: 'title',
              title: 'Book Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'author',
              title: 'Author',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'category',
              title: 'Category',
              type: 'string',
              options: {
                list: [
                  { title: 'Leadership', value: 'leadership' },
                  { title: 'Visual Design', value: 'visual-design' },
                  { title: 'Design Systems', value: 'design-systems' },
                  { title: 'User Experience', value: 'user-experience' },
                  { title: 'Product Management', value: 'product-management' },
                  { title: 'Business', value: 'business' },
                  { title: 'Technology', value: 'technology' },
                  { title: 'Psychology', value: 'psychology' },
                  { title: 'Philosophy', value: 'philosophy' },
                  { title: 'Fiction', value: 'fiction' },
                  { title: 'Biography', value: 'biography' },
                  { title: 'Other', value: 'other' },
                ],
                layout: 'dropdown',
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
              description: 'Link to the book (Amazon, publisher, etc.)',
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 2,
              description: 'Optional notes about the book',
            }),
            defineField({
              name: 'isbn',
              title: 'ISBN',
              type: 'string',
              hidden: true,
            }),
            defineField({
              name: 'publishedYear',
              title: 'Published Year',
              type: 'string',
              hidden: true,
            }),
            defineField({
              name: 'publisher',
              title: 'Publisher',
              type: 'string',
              hidden: true,
            }),
            defineField({
              name: 'coverId',
              title: 'Cover ID',
              type: 'string',
              hidden: true,
            }),
          ],
          preview: {
            select: {
              title: 'title',
              author: 'author',
              category: 'category',
            },
            prepare(selection) {
              const { title, author, category } = selection
              return {
                title: title || 'Untitled',
                subtitle: `${author} • ${category}`,
              }
            },
          },
        },
      ],
      description: 'Add books to your reading list, organized by category',
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
