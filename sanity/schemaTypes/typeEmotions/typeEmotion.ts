import {ColorWheelIcon, ComposeIcon, DocumentTextIcon, EarthGlobeIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {AxisCoordinateInput} from './axisCoordinateInput'

export const typeEmotion = defineType({
  name: 'typeEmotion',
  title: 'Type emotion',
  type: 'document',
  icon: EarthGlobeIcon,
  groups: [
    {name: 'content', title: 'Content', default: true, icon: DocumentTextIcon},
    {name: 'type', title: 'Type', icon: ComposeIcon},
    {name: 'palette', title: 'Palette', icon: ColorWheelIcon},
  ],
  fields: [
    defineField({
      name: 'emotionId',
      title: 'Emotion ID',
      type: 'slug',
      group: 'content',
      description: 'Stable id used in URLs and matching (e.g. calm, playful).',
      options: {source: 'label', maxLength: 64},
      validation: (Rule) =>
        Rule.required().error('An emotion ID is required for catalog lookups and search.'),
    }),
    defineField({
      name: 'label',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required().error('A label is shown in the playground UI.'),
    }),
    defineField({
      name: 'synonyms',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
      description: 'Search aliases that resolve to this emotion.',
    }),
    defineField({
      name: 'specimenWord',
      type: 'string',
      group: 'content',
      description: 'Default editable specimen text for this emotion.',
    }),
    defineField({
      name: 'reason',
      type: 'text',
      rows: 3,
      group: 'content',
      description: 'Internal / editor-facing notes only — not shown on the public primary UI.',
    }),
    defineField({
      name: 'fontFace',
      title: 'Font face',
      type: 'array',
      group: 'type',
      of: [defineArrayMember({type: 'reference', to: [{type: 'variableFontFace'}]})],
      description: 'Primary variable font (use the first reference).',
      validation: (Rule) =>
        Rule.required()
          .min(1)
          .error('At least one font face is required; the first is used as primary.'),
    }),
    defineField({
      name: 'alternateFontFaces',
      title: 'Alternate font faces',
      type: 'array',
      group: 'type',
      of: [defineArrayMember({type: 'reference', to: [{type: 'variableFontFace'}]})],
      description: 'Switchable alternate variable fonts for the kitchen-sink playground.',
    }),
    defineField({
      name: 'coordinate',
      type: 'array',
      group: 'type',
      of: [defineArrayMember({type: 'axisTagValue'})],
      description: 'Featured look at intensity 50.',
      components: {input: AxisCoordinateInput},
    }),
    defineField({
      name: 'intense',
      type: 'array',
      group: 'type',
      of: [defineArrayMember({type: 'axisTagValue'})],
      description: 'Look at intensity 100 (subdued mirrors toward defaults at 0).',
      components: {input: AxisCoordinateInput},
    }),
    defineField({
      name: 'italic',
      type: 'string',
      group: 'type',
      options: {
        list: [
          {title: 'None (roman)', value: 'none'},
          {title: 'Italic', value: 'italic'},
        ],
        layout: 'radio',
      },
      initialValue: 'none',
    }),
    defineField({
      name: 'transform',
      type: 'string',
      group: 'type',
      options: {
        list: [
          {title: 'None', value: 'none'},
          {title: 'Uppercase', value: 'uppercase'},
        ],
        layout: 'radio',
      },
      initialValue: 'none',
    }),
    defineField({
      name: 'palette',
      type: 'array',
      group: 'palette',
      of: [defineArrayMember({type: 'reference', to: [{type: 'specimenPalette'}]})],
      description: 'Coolors-backed specimen palette (first reference wins).',
    }),
    defineField({
      name: 'surface',
      type: 'string',
      group: 'palette',
      options: {
        list: [
          {title: 'Light', value: 'light'},
          {title: 'Mist', value: 'mist'},
          {title: 'Warm', value: 'warm'},
          {title: 'Dark', value: 'dark'},
          {title: 'Ink', value: 'ink'},
        ],
        layout: 'dropdown',
      },
      description: 'Fallback chrome when no Coolors palette is set.',
      initialValue: 'light',
    }),
  ],
  preview: {
    select: {
      title: 'label',
      emotionId: 'emotionId.current',
      fontLabel: 'fontFace.0->label',
    },
    prepare({title, emotionId, fontLabel}) {
      const id = emotionId || 'no id'
      const font = fontLabel ? ` · ${fontLabel}` : ''
      return {
        title: title || 'Untitled emotion',
        subtitle: `${id}${font}`,
      }
    },
  },
})
