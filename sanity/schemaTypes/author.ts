import {defineField, defineType} from 'sanity'

export const author = defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required().error('Author name is required'),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required().error('Slug is required for URL generation'),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'creditedImage',
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'array',
      of: [
        {
          title: 'Block',
          type: 'block',
          styles: [{title: 'Normal', value: 'normal'}],
          lists: [],
        },
      ],
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.email().error('Please enter a valid email address'),
    }),
    defineField({
      name: 'website',
      title: 'Website',
      type: 'url',
    }),
    defineField({
      name: 'social',
      title: 'Social Links',
      type: 'object',
      fields: [
        defineField({
          name: 'twitter',
          title: 'Twitter',
          type: 'string',
        }),
        defineField({
          name: 'linkedin',
          title: 'LinkedIn',
          type: 'string',
        }),
        defineField({
          name: 'github',
          title: 'GitHub',
          type: 'string',
        }),
      ],
    }),
  ],
  groups: [
    {
      name: 'content',
      title: 'Content',
      default: true,
    },
    {
      name: 'social',
      title: 'Social',
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'email',
      media: 'image',
    },
    prepare(selection) {
      const {title, subtitle} = selection
      return {
        title: title || 'Untitled',
        subtitle: subtitle || 'No email',
      }
    },
  },
})