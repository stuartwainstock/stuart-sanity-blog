import {defineField, defineType} from 'sanity'
import {UserIcon} from '@sanity/icons'

export const author = defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  icon: UserIcon,
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
          name: 'credit',
          type: 'string',
          title: 'Photo Credit',
          description: 'Credit the photographer (auto-populated for Unsplash images)',
        },
      ],
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
      icon: UserIcon,
      default: true,
    },
    {
      name: 'social',
      title: 'Social',
      icon: UserIcon,
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