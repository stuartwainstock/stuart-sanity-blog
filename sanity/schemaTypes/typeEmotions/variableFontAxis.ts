import {ControlsIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export const variableFontAxis = defineType({
  name: 'variableFontAxis',
  title: 'Variable font axis',
  type: 'object',
  icon: ControlsIcon,
  fields: [
    defineField({
      name: 'tag',
      type: 'string',
      description: 'OpenType axis tag (e.g. wght, SOFT, opsz).',
      validation: (Rule) =>
        Rule.required().error('An axis tag is required to map slider values to the font.'),
    }),
    defineField({
      name: 'label',
      type: 'string',
      description: 'Human-readable slider label.',
    }),
    defineField({
      name: 'min',
      type: 'number',
      validation: (Rule) => Rule.required().error('Min bounds the axis range.'),
    }),
    defineField({
      name: 'max',
      type: 'number',
      validation: (Rule) => Rule.required().error('Max bounds the axis range.'),
    }),
    defineField({
      name: 'step',
      type: 'number',
      validation: (Rule) => Rule.required().error('Step controls slider granularity.'),
    }),
    defineField({
      name: 'default',
      type: 'number',
      description: 'Neutral / rest value for this axis.',
      validation: (Rule) =>
        Rule.required().error('A default value is required when no emotion coordinate is set.'),
    }),
    defineField({
      name: 'group',
      type: 'string',
      options: {
        list: [
          {title: 'Core', value: 'core'},
          {title: 'Parametric', value: 'parametric'},
          {title: 'Expression', value: 'expression'},
        ],
        layout: 'radio',
      },
      description: 'Optional grouping for denser slider UIs.',
    }),
  ],
  preview: {
    select: {
      tag: 'tag',
      label: 'label',
    },
    prepare({tag, label}) {
      return {
        title: tag || 'Untitled axis',
        subtitle: label || undefined,
      }
    },
  },
})
