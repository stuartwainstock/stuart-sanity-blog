import {BlockElementIcon, ControlsIcon, DocumentTextIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const variableFontFace = defineType({
  name: 'variableFontFace',
  title: 'Variable font face',
  type: 'document',
  icon: BlockElementIcon,
  groups: [
    {name: 'identity', title: 'Identity', default: true, icon: DocumentTextIcon},
    {name: 'axes', title: 'Axes', icon: ControlsIcon},
  ],
  fields: [
    defineField({
      name: 'key',
      type: 'string',
      group: 'identity',
      description: 'Stable app key — must match next/font CSS vars in fonts.ts.',
      options: {
        list: [
          {title: 'Fraunces', value: 'fraunces'},
          {title: 'Recursive', value: 'recursive'},
          {title: 'Roboto Flex', value: 'robotoFlex'},
          {title: 'Bricolage Grotesque', value: 'bricolage'},
          {title: 'Anybody', value: 'anybody'},
          {title: 'Nabla', value: 'nabla'},
          {title: 'Shantell Sans', value: 'shantell'},
          {title: 'Workbench', value: 'workbench'},
        ],
        layout: 'dropdown',
      },
      validation: (Rule) =>
        Rule.required().error('A font key ties this document to the app font loader.'),
    }),
    defineField({
      name: 'label',
      type: 'string',
      group: 'identity',
      validation: (Rule) => Rule.required().error('A label identifies the face in Studio and the UI.'),
    }),
    defineField({
      name: 'googleFontName',
      type: 'string',
      group: 'identity',
      description: 'Google Fonts family name (e.g. Fraunces, Roboto Flex).',
    }),
    defineField({
      name: 'cssVar',
      type: 'string',
      group: 'identity',
      description: 'CSS custom property from next/font, e.g. --font-specimen-fraunces.',
    }),
    defineField({
      name: 'fallback',
      type: 'string',
      group: 'identity',
      description: 'Fallback stack used when variable axes disable next/font auto-fallback.',
    }),
    defineField({
      name: 'category',
      type: 'string',
      group: 'identity',
      options: {
        list: [
          {title: 'Serif', value: 'serif'},
          {title: 'Sans', value: 'sans'},
          {title: 'Display', value: 'display'},
          {title: 'Mono', value: 'mono'},
          {title: 'Experimental', value: 'experimental'},
        ],
        layout: 'dropdown',
      },
    }),
    defineField({
      name: 'italicSupport',
      type: 'string',
      group: 'identity',
      options: {
        list: [
          {title: 'Roman only', value: 'roman'},
          {title: 'Roman and italic', value: 'romanAndItalic'},
        ],
        layout: 'radio',
      },
      initialValue: 'roman',
    }),
    defineField({
      name: 'axes',
      type: 'array',
      group: 'axes',
      of: [defineArrayMember({type: 'variableFontAxis'})],
      description: 'Kitchen-sink axis set exposed as sliders for this face.',
    }),
  ],
  preview: {
    select: {
      title: 'label',
      key: 'key',
    },
    prepare({title, key}) {
      return {
        title: title || 'Untitled face',
        subtitle: key || undefined,
      }
    },
  },
})
