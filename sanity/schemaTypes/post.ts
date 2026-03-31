import {defineArrayMember, defineField, defineType} from 'sanity'

export const post = defineType({
  name: 'post',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required().error('Title is required'),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required().error('Slug is required for URL generation'),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({type: 'reference', to: [{type: 'author'}]})],
      validation: (Rule) =>
        Rule.min(1).error('At least one author is required').unique().error('Duplicate authors'),
    }),
    defineField({
      name: 'mainImage',
      title: 'Main image',
      type: 'image',
      group: 'content',
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
      name: 'categories',
      title: 'Categories',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({type: 'reference', to: {type: 'category'}})],
      validation: (Rule) => Rule.unique().error('Duplicate categories'),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      group: 'content',
      validation: (Rule) => Rule.required().error('Publication date is required'),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      group: 'content',
      rows: 4,
      validation: (Rule) => [
        Rule.max(200).warning('Keep excerpts under 200 characters for better readability'),
        Rule.min(50).warning('Consider at least 50 characters for better previews'),
        Rule.required().error('Excerpt is required for post previews'),
      ],
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      group: 'content',
      options: {layout: 'switch'},
      initialValue: false,
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'blockContent',
      group: 'content',
      validation: (Rule) => Rule.required().error('Body is required'),
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
    }),
  ],
  groups: [
    {
      name: 'content',
      title: 'Content',
      default: true,
    },
    {
      name: 'seo',
      title: 'SEO',
    },
  ],
  orderings: [
    {
      title: 'Published date (newest)',
      name: 'publishedAtDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
    {
      title: 'Published date (oldest)',
      name: 'publishedAtAsc',
      by: [{field: 'publishedAt', direction: 'asc'}],
    },
    {
      title: 'Title',
      name: 'titleAsc',
      by: [{field: 'title', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author.0.name',
      media: 'mainImage',
      publishedAt: 'publishedAt',
    },
    prepare(selection) {
      const {title, author, publishedAt} = selection
      return {
        title: title || 'Untitled',
        subtitle: `${author || 'No author'} • ${publishedAt ? new Date(publishedAt).toLocaleDateString() : 'Not published'}`,
      }
    },
  },
})