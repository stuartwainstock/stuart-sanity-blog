import {defineField, defineType} from 'sanity'
import {EyeOpenIcon, AccessDeniedIcon, EarthGlobeIcon, ImageIcon} from '@sanity/icons'

export const birdSighting = defineType({
  name: 'birdSighting',
  title: 'Bird Sighting',
  type: 'document',
  icon: EyeOpenIcon,
  groups: [
    {name: 'identity', title: 'Identity', icon: EyeOpenIcon, default: true},
    {name: 'visual', title: 'Card image', icon: ImageIcon},
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

    // ── Card image (approved) + Unsplash suggestion (review) ─────────────────
    defineField({
      name: 'cardImage',
      title: 'Card image',
      type: 'image',
      group: 'visual',
      options: {hotspot: true},
      description:
        'Optional hero image on the Birding Dashboard card. Pick from Unsplash (asset source) or upload. Leave empty until you approve a suggestion or choose your own.',
    }),
    defineField({
      name: 'cardImageAlt',
      title: 'Card image alt text',
      type: 'string',
      group: 'visual',
      description:
        'Short description of the photograph for screen readers (what is shown in the image). When empty, the card falls back to Alt Text below if present.',
      validation: (Rule) => [
        Rule.max(200).warning('Keep image alt text concise (under ~200 characters).'),
      ],
    }),
    defineField({
      name: 'imageSuggestionStatus',
      title: 'Image suggestion status',
      type: 'string',
      group: 'visual',
      initialValue: 'none',
      options: {
        list: [
          {title: 'No active suggestion', value: 'none'},
          {title: 'Pending review (script suggested an image — verify, then add Card image)', value: 'pending_review'},
          {title: 'Dismissed (do not auto-suggest again for this sighting)', value: 'dismissed'},
        ],
        layout: 'radio',
      },
      description:
        'Run `npm run birding:suggest-unsplash` locally to populate a suggested Unsplash preview. When satisfied, add Card image from Studio (Unsplash asset source), set Card image alt text, then set status to No active suggestion.',
    }),
    defineField({
      name: 'suggestedCoverProvider',
      title: 'Suggested cover source',
      type: 'string',
      group: 'visual',
      initialValue: 'none',
      options: {
        list: [
          {title: 'None', value: 'none'},
          {title: 'Unsplash (search API — editor must still approve)', value: 'unsplash'},
        ],
        layout: 'radio',
      },
      readOnly: true,
      description: 'Filled automatically by the suggestion script for traceability.',
    }),
    defineField({
      name: 'suggestedCoverImageUrl',
      title: 'Suggested image (preview URL)',
      type: 'url',
      group: 'visual',
      readOnly: true,
      description: 'Temporary Unsplash CDN URL for review only. Do not rely on this for the live site.',
    }),
    defineField({
      name: 'suggestedCoverImagePageUrl',
      title: 'Suggested image on Unsplash',
      type: 'url',
      group: 'visual',
      readOnly: true,
      description: 'Open this link in Studio to verify licensing context before adding Card image.',
    }),
    defineField({
      name: 'suggestedCoverPhotographerName',
      title: 'Suggested photographer name',
      type: 'string',
      group: 'visual',
      readOnly: true,
    }),
    defineField({
      name: 'suggestedCoverPhotographerPageUrl',
      title: 'Suggested photographer on Unsplash',
      type: 'url',
      group: 'visual',
      readOnly: true,
    }),
    defineField({
      name: 'suggestedCoverAltDraft',
      title: 'Suggested alt text (draft)',
      type: 'text',
      rows: 2,
      group: 'visual',
      readOnly: true,
      description:
        'Draft alt text for the suggested photo. Copy into Card image alt text after you verify the image matches the species.',
      validation: (Rule) => [Rule.max(400).warning('Keep draft alt text under ~400 characters.')],
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
