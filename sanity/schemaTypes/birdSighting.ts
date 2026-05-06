import {defineField, defineType} from 'sanity'
import {EyeOpenIcon} from '@sanity/icons'
import {BirdSightingUnsplashSuggestionPanel} from '../components/BirdSightingUnsplashSuggestionPanel'
import {BirdSightingAudioSuggestionPanel} from '../components/BirdSightingAudioSuggestionPanel'

export const birdSighting = defineType({
  name: 'birdSighting',
  title: 'Bird Sighting',
  type: 'document',
  icon: EyeOpenIcon,
  fields: [
    // ── Identity ──────────────────────────────────────────────────────────────
    defineField({
      name: 'speciesName',
      title: 'Species Name',
      type: 'string',
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
      description: 'Date of the observation (YYYY-MM-DD).',
      validation: (Rule) => [Rule.required().error('Observation date is required.')],
    }),
    defineField({
      name: 'locationLabel',
      title: 'Location Label',
      type: 'string',
      description: 'Human-readable location name from eBird (e.g. "Bald Eagle SNA--Pool 4").',
    }),

    // ── Card image: editor-driven suggestion + publish via Card image + workflow ─
    defineField({
      name: 'imageSuggestionStatus',
      title: 'Suggestion workflow',
      type: 'string',
      initialValue: 'none',
      options: {
        list: [
          {
            title: 'Done — no open suggestion (use after Card image is set)',
            value: 'none',
          },
          {
            title: 'Review pending — suggestion exists; add Card image + alt to publish',
            value: 'pending_review',
          },
          {
            title: 'Dismissed — reject suggestion; do not auto-suggest again for this sighting',
            value: 'dismissed',
          },
        ],
        layout: 'radio',
      },
      components: {
        input: BirdSightingUnsplashSuggestionPanel,
      },
    }),

    // ── Machine-written suggestion fields (hidden from editor UI) ─────────────
    // All of these are read/written exclusively by the suggest-unsplash API route.
    // The BirdSightingUnsplashSuggestionPanel above surfaces everything editors
    // need — showing these raw fields would only add noise.
    defineField({name: 'suggestedCoverImageUrl', title: 'Suggested image URL', type: 'url', readOnly: true, hidden: true}),
    defineField({name: 'suggestedCoverImagePageUrl', title: 'Suggested image page URL', type: 'url', readOnly: true, hidden: true}),
    defineField({name: 'suggestedCoverPhotographerName', title: 'Suggested photographer name', type: 'string', readOnly: true, hidden: true}),
    defineField({name: 'suggestedCoverPhotographerPageUrl', title: 'Suggested photographer page URL', type: 'url', readOnly: true, hidden: true}),
    defineField({name: 'suggestedCoverAltDraft', title: 'Suggested alt draft', type: 'text', readOnly: true, hidden: true}),
    defineField({name: 'suggestedCoverSearchQueryManual', title: 'Unsplash search query override', type: 'string', hidden: true}),
    defineField({name: 'suggestedCoverSearchQueryLast', title: 'Last Unsplash search query', type: 'string', readOnly: true, hidden: true}),
    defineField({name: 'suggestedCoverSearchPage', title: 'Unsplash search page', type: 'number', readOnly: true, hidden: true, initialValue: 1}),
    defineField({name: 'suggestedCoverProvider', title: 'Suggested cover source', type: 'string', readOnly: true, hidden: true, initialValue: 'none'}),
    defineField({
      name: 'cardImage',
      title: 'Card image (published on dashboard)',
      type: 'image',
      options: {hotspot: true},
      description:
        'Live image shown on the dashboard. Click “Use this photo” in the suggestion panel above to fill this automatically, or upload your own.',
    }),
    defineField({
      name: 'cardImageAlt',
      title: 'Card image alt text',
      type: 'string',
      description:
        'Short description of the photograph for screen readers. Keep it concise and species-accurate.',
      validation: (Rule) => [
        Rule.max(200).warning('Keep image alt text concise (under ~200 characters).'),
      ],
    }),

    // ── Accessibility ─────────────────────────────────────────────────────────
    defineField({
      name: 'altText',
      title: 'Alt Text',
      type: 'text',
      rows: 3,
      description:
        'Screen reader description of this sighting. Describe what a sighted person would see: species, plumage, posture, setting.',
      validation: (Rule) => [
        Rule.required().error(
          'Alt text is required for screen reader accessibility. Add a descriptive sentence before publishing.'
        ),
        Rule.min(20).warning('Alt text should be at least 20 characters to be useful.'),
        Rule.max(300).warning('Keep alt text under 300 characters.'),
      ],
    }),
    defineField({
      name: 'plumageColors',
      title: 'Plumage Colors',
      type: 'array',
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
      name: 'audioSuggestionStatus',
      title: 'Audio suggestion',
      type: 'string',
      initialValue: 'none',
      options: {
        list: [
          {title: 'Done \u2014 no open suggestion', value: 'none'},
          {title: 'Review pending \u2014 suggestion exists', value: 'pending_review'},
          {title: 'Dismissed \u2014 do not auto-suggest again', value: 'dismissed'},
        ],
        layout: 'radio',
      },
      components: {
        input: BirdSightingAudioSuggestionPanel,
      },
    }),

    // \u2500\u2500 Machine-written audio suggestion fields (hidden from editor UI) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    // All read/written exclusively by the suggest-audio API route.
    // The BirdSightingAudioSuggestionPanel surfaces everything editors need.
    defineField({name: 'suggestedAudioUrl', title: 'Suggested audio URL', type: 'url', readOnly: true, hidden: true}),
    defineField({name: 'suggestedAudioRecordist', title: 'Suggested audio recordist', type: 'string', readOnly: true, hidden: true}),
    defineField({name: 'suggestedAudioSourceUrl', title: 'Suggested audio source URL', type: 'url', readOnly: true, hidden: true}),
    defineField({name: 'suggestedAudioType', title: 'Suggested audio type', type: 'string', readOnly: true, hidden: true}),
    defineField({name: 'suggestedAudioQuality', title: 'Suggested audio quality', type: 'string', readOnly: true, hidden: true}),
    defineField({name: 'suggestedAudioLength', title: 'Suggested audio length', type: 'string', readOnly: true, hidden: true}),
    defineField({name: 'suggestedAudioPage', title: 'Suggested audio page', type: 'number', readOnly: true, hidden: true, initialValue: 1}),

    defineField({
      name: 'callAudioUrl',
      title: 'Call Audio URL',
      type: 'url',
      description:
        'Direct URL to an audio file (.mp3 or .ogg) of this species\u2019 call or song. Set automatically when you confirm a Xeno-canto suggestion above, or enter a URL manually.',
      validation: (Rule) => [
        Rule.uri({scheme: ['http', 'https']}).error('Must be a valid http or https URL.'),
      ],
    }),

    // ── Location & Source ─────────────────────────────────────────────────────
    defineField({
      name: 'latitude',
      title: 'Latitude',
      type: 'number',
      description: 'Decimal latitude from eBird.',
      validation: (Rule) => [
        Rule.min(-90).max(90).error('Latitude must be between -90 and 90.'),
      ],
    }),
    defineField({
      name: 'longitude',
      title: 'Longitude',
      type: 'number',
      description: 'Decimal longitude from eBird.',
      validation: (Rule) => [
        Rule.min(-180).max(180).error('Longitude must be between -180 and 180.'),
      ],
    }),
    defineField({
      name: 'ebirdChecklistUri',
      title: 'eBird Checklist URL',
      type: 'url',
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
