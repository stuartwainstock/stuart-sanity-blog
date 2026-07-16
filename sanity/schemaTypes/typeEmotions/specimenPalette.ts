import {ColorWheelIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const specimenPalette = defineType({
  name: 'specimenPalette',
  title: 'Specimen palette',
  type: 'document',
  icon: ColorWheelIcon,
  groups: [
    {name: 'identity', title: 'Identity', default: true},
    {name: 'roles', title: 'Roles'},
  ],
  fields: [
    defineField({
      name: 'key',
      type: 'string',
      group: 'identity',
      description: 'Stable palette id used by emotions and the app.',
      options: {
        list: [
          {title: 'Candy Pop', value: 'candy-pop'},
          {title: 'Fiery Ocean', value: 'fiery-ocean'},
          {title: 'Magenta Dream', value: 'magenta-dream'},
          {title: 'Neutral Elegance', value: 'neutral-elegance'},
          {title: 'Ocean Blue Serenity', value: 'ocean-blue-serenity'},
        ],
        layout: 'dropdown',
      },
      validation: (Rule) => Rule.required().error('A palette key is required for app lookups.'),
    }),
    defineField({
      name: 'label',
      type: 'string',
      group: 'identity',
      validation: (Rule) => Rule.required().error('A label names the palette in Studio and the UI.'),
    }),
    defineField({
      name: 'sourceUrl',
      title: 'Source URL',
      type: 'url',
      group: 'identity',
      description: 'Coolors generator / share link.',
      validation: (Rule) => Rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'swatches',
      type: 'array',
      group: 'identity',
      of: [defineArrayMember({type: 'string'})],
      description: 'Original Coolors swatch order, hex without # (e.g. FEE440).',
      validation: (Rule) =>
        Rule.max(10).warning('Coolors palettes are typically 1–10 swatches.'),
    }),
    defineField({
      name: 'roles',
      type: 'specimenPaletteRoles',
      group: 'roles',
      description: 'Mapped into specimen CSS custom properties at default intensity.',
      validation: (Rule) =>
        Rule.required().error('Base role colors are required for specimen chrome.'),
    }),
    defineField({
      name: 'intensityHigh',
      title: 'Intensity high overrides',
      type: 'specimenPaletteRoles',
      group: 'roles',
      description: 'Optional partial role overrides around high intensity.',
    }),
    defineField({
      name: 'intensityMax',
      title: 'Intensity max overrides',
      type: 'specimenPaletteRoles',
      group: 'roles',
      description: 'Optional partial role overrides at maximum intensity.',
    }),
  ],
  preview: {
    select: {
      title: 'label',
      key: 'key',
    },
    prepare({title, key}) {
      return {
        title: title || 'Untitled palette',
        subtitle: key || undefined,
      }
    },
  },
})
