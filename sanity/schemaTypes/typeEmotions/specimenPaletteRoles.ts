import {ColorWheelIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

const HEX_PATTERN = /^#?[0-9A-Fa-f]{3,8}$/

function hexField(name: string, title: string) {
  return defineField({
    name,
    title,
    type: 'string',
    description: 'Hex color (with or without #).',
    validation: (Rule) =>
      Rule.custom((value) => {
        if (value == null || value === '') return true
        return HEX_PATTERN.test(value) || 'Use a hex color like #FEE440 or FEE440.'
      }),
  })
}

/** Role colors for specimen chrome; also reused for intensity overrides (partial OK). */
export const specimenPaletteRoles = defineType({
  name: 'specimenPaletteRoles',
  title: 'Specimen palette roles',
  type: 'object',
  icon: ColorWheelIcon,
  fields: [
    hexField('bg', 'Background'),
    hexField('fg', 'Foreground'),
    hexField('muted', 'Muted'),
    hexField('line', 'Line'),
    hexField('accent', 'Accent'),
    hexField('chipBg', 'Chip background'),
    hexField('chipSelectedBg', 'Chip selected background'),
    hexField('chipSelectedFg', 'Chip selected foreground'),
  ],
})
