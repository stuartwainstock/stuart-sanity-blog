import {defineType, defineArrayMember, defineField} from 'sanity'
import {parseYouTubeVideoId} from '../../src/lib/youtube'

export const blockContent = defineType({
  title: 'Block Content',
  name: 'blockContent',
  type: 'array',
  of: [
    defineArrayMember({
      title: 'Block',
      type: 'block',
      styles: [
        {title: 'Normal', value: 'normal'},
        {title: 'H1', value: 'h1'},
        {title: 'H2', value: 'h2'},
        {title: 'H3', value: 'h3'},
        {title: 'H4', value: 'h4'},
        {title: 'Quote', value: 'blockquote'},
      ],
      lists: [{title: 'Bullet', value: 'bullet'}],
      marks: {
        decorators: [
          {title: 'Strong', value: 'strong'},
          {title: 'Emphasis', value: 'em'},
          {title: 'Code', value: 'code'},
        ],
        annotations: [
          {
            title: 'URL',
            name: 'link',
            type: 'object',
            fields: [
              {
                title: 'URL',
                name: 'href',
                type: 'url',
              },
            ],
          },
        ],
      },
    }),
    defineArrayMember({
      type: 'image',
      options: {hotspot: true},
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
    defineArrayMember({
      name: 'codeBlock',
      title: 'Code Block',
      type: 'object',
      fields: [
        {
          name: 'language',
          title: 'Language',
          type: 'string',
          options: {
            list: [
              {title: 'JavaScript', value: 'javascript'},
              {title: 'TypeScript', value: 'typescript'},
              {title: 'HTML', value: 'html'},
              {title: 'CSS', value: 'css'},
              {title: 'Python', value: 'python'},
              {title: 'JSON', value: 'json'},
              {title: 'Bash', value: 'bash'},
            ],
          },
        },
        {
          name: 'code',
          title: 'Code',
          type: 'text',
          rows: 10,
        },
      ],
      preview: {
        select: {
          language: 'language',
          code: 'code',
        },
        prepare(selection) {
          const {language, code} = selection
          return {
            title: `Code Block (${language || 'Plain text'})`,
            subtitle: code ? code.substring(0, 50) + '...' : 'No code',
          }
        },
      },
    }),
    defineArrayMember({
      name: 'youtube',
      title: 'YouTube video',
      type: 'object',
      fields: [
        defineField({
          name: 'url',
          title: 'YouTube URL',
          type: 'url',
          description: 'Paste a watch, Shorts, or youtu.be link.',
          validation: (Rule) =>
            Rule.required().uri({allowRelative: false, scheme: ['http', 'https']}).custom((url) => {
              if (!url || typeof url !== 'string') return 'URL is required'
              return parseYouTubeVideoId(url) ? true : 'Use a valid YouTube or youtu.be URL'
            }),
        }),
        defineField({
          name: 'title',
          title: 'Video title (accessibility)',
          type: 'string',
          description:
            'Short label for screen readers (iframe title). If empty, a generic label is used.',
        }),
        defineField({
          name: 'caption',
          title: 'Caption',
          type: 'string',
          description: 'Optional caption below the video.',
        }),
      ],
      preview: {
        select: {
          url: 'url',
          caption: 'caption',
        },
        prepare({url, caption}: {url?: string; caption?: string}) {
          const id = url ? parseYouTubeVideoId(url) : null
          return {
            title: 'YouTube video',
            subtitle: caption || (id ? `Video ID: ${id}` : url) || '',
          }
        },
      },
    }),
  ],
})
