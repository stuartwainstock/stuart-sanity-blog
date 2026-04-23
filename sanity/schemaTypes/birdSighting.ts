import {defineField, defineType} from 'sanity'
import {EyeOpenIcon, AccessDeniedIcon, EarthGlobeIcon} from '@sanity/icons'

export const birdSighting = defineType({
  name: 'birdSighting',
  title: 'Bird Sighting',
  type: 'document',
  icon: EyeOpenIcon,
  groups: [
    {name: 'identity', title: 'Identity', icon: EyeOpenIcon, default: true},
    {name: 'accessibility', title: 'Accessibility', icon: AccessDeniedIcon},
    {name: 'location', title: 'Location & Source', icon: EarthGlobeIcon},
  ],
  fields: [
    // ── Identity ──────────────────────────────────────────────────────────────
    defineField({
      name: 'speciesName',
      title: 'Species Name',
      type: 'string',
      group: 'identity',
      description: 'Common name of the species (e.g. "Pileated Woodpecker").',
      validation: (Rule) => [
        Rule.required().error('Species name is required.'),
        Rule.max(120).warning('Keep species names under 120 characters.'),
      ],
    }),
    defineField({
      name: 'speciesCode',
      title: 'eBird Species Code',
      type: 'string',
      group: 'identity',
      description: 'eBird alpha code used as a deduplication key (e.g. "pilwoo").',
      validation: (Rule) => [
        Rule.required().error('eBird species code is required for deduplication.'),
        Rule.max(10).warning('Species codes are typically 6 characters or fewer.'),
      ],
    }),
    defineField({
      name: 'observedOn',
      title: 'Observed On',
      type: 'date',
      group: 'identity',
      description: 'Date of the observation (YYYY-MM-DD).',
      validation: (Rule) => [Rule.required().error('Observation date is required.')],
    }),
    defineField({
      name: 'locationLabel',
      title: 'Location Label',
      type: 'string',
      group: 'identity',
      description: 'Human-readable location name from eBird (e.g. "Bald Eagle SNA--Pool 4").',
    }),

    // ── Accessibility ─────────────────────────────────────────────────────────
    defineField({
      name: 'altText',
      title: 'Alt Text',
      type: 'text',
      group: 'accessibility',
      rows: 3,
      description:
        'Screen reader description of this sighting. Describe what a sighted person would see: species, plumage, posture, setting.',
      validation: (Rule) => [
        Rule.required().warning(
          'Alt text is required for screen reader accessibility. Add a descriptive sentence.'
        ),
        Rule.min(20).warning('Alt text should be at least 20 characters to be useful.'),
        Rule.max(300).warning('Keep alt text under 300 characters.'),
      ],
    }),
    defineField({
      name: 'plumageColors',
      title: 'Plumage Colors',
      type: 'array',
      group: 'accessibility',
      of: [
        {
          type: 'string',
          validation: (Rule) =>
            Rule.regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).error(
              'Must be a valid hex color (e.g. #ff0000 or #f00).'
            ),
        },
      ],
      description:
        'Hex color codes representing this species\u2019 plumage, used to render a high-contrast color map (e.g. "#c0392b", "#2c3e50").',
      validation: (Rule) => [Rule.max(8).warning('Limit to 8 swatches for visual clarity.')],
    }),
    defineField({
      name: 'callAudioUrl',
      title: 'Call Audio URL',
      type: 'url',
      group: 'accessibility',
      description:
        'Direct URL to an audio file (.mp3 or .ogg) of this species\u2019 call or song. Macaulay Library links are preferred.',
      validation: (Rule) => [
        Rule.uri({scheme: ['http', 'https']}).error('Must be a valid http or https URL.'),
      ],
    }),

    // ── Location & Source ─────────────────────────────────────────────────────
    defineField({
      name: 'latitude',
      title: 'Latitude',
      type: 'number',
      group: 'location',
      description: 'Decimal latitude from eBird.',
      validation: (Rule) => [
        Rule.min(-90).max(90).error('Latitude must be between -90 and 90.'),
      ],
    }),
    defineField({
      name: 'longitude',
      title: 'Longitude',
      type: 'number',
      group: 'location',
      description: 'Decimal longitude from eBird.',
      validation: (Rule) => [
        Rule.min(-180).max(180).error('Longitude must be between -180 and 180.'),
      ],
    }),
    defineField({
      name: 'ebirdChecklistUri',
      title: 'eBird Checklist URL',
      type: 'url',
      group: 'location',
      description: 'Link to the source eBird checklist (e.g. https://ebird.org/checklist/S12345).',
      validation: (Rule) => [
        Rule.uri({scheme: ['https']}).error('Must be a valid https URL.'),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'speciesName',
      subtitle: 'observedOn',
      description: 'locationLabel',
    },
    prepare({title, subtitle, description}) {
      return {
        title: title || 'Unnamed sighting',
        subtitle: [subtitle, description].filter(Boolean).join(' · '),
      }
    },
  },
  orderings: [
    {
      title: 'Observed On (newest first)',
      name: 'observedOnDesc',
      by: [{field: 'observedOn', direction: 'desc'}],
    },
    {
      title: 'Species Name (A–Z)',
      name: 'speciesNameAsc',
      by: [{field: 'speciesName', direction: 'asc'}],
    },
  ],
})
