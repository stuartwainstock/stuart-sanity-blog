import {ControlsIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export const axisTagValue = defineType({
  name: 'axisTagValue',
  title: 'Axis tag / value',
  type: 'object',
  icon: ControlsIcon,
  fields: [
    defineField({
      name: 'tag',
      type: 'string',
      description: 'OpenType axis tag matching the primary font face.',
      validation: (Rule) => Rule.required().error('An axis tag is required for each coordinate.'),
    }),
    defineField({
      name: 'value',
      type: 'number',
      validation: (Rule) => Rule.required().error('A numeric value is required for each axis.'),
    }),
  ],
  preview: {
    select: {
      tag: 'tag',
      value: 'value',
    },
    prepare({tag, value}) {
      return {
        title: tag || 'Untitled axis',
        subtitle: typeof value === 'number' ? String(value) : undefined,
      }
    },
  },
})
