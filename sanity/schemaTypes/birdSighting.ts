import {defineField, defineType} from 'sanity'
import {EyeOpenIcon, AccessDeniedIcon, EarthGlobeIcon, ImageIcon} from '@sanity/icons'
import {SuggestedCoverImageUrlInput} from '../components/SuggestedCoverImageUrlInput'

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

    // ── Card image: script suggestion first, then publish via Card image + workflow ─
    defineField({
      name: 'suggestedCoverImageUrl',
      title: 'Suggested image (preview URL)',
      type: 'url',
      group: 'visual',
      readOnly: true,
      description:
        'There is no separate Approve control: add the chosen photo under Card image (Unsplash asset source or upload), then mark the workflow complete below. This URL is a temporary Unsplash CDN preview for review only — do not rely on it for the live site.',
      components: {
        input: SuggestedCoverImageUrlInput,
      },
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
        'Draft alt text for the suggested photo (from Unsplash metadata when available, plus species / location). Copy into Card image alt text after you verify the image matches the species.',
      validation: (Rule) => [Rule.max(400).warning('Keep draft alt text under ~400 characters.')],
    }),
    defineField({
      name: 'suggestedCoverSearchQueryManual',
      title: 'Unsplash search query (manual override)',
      type: 'string',
      group: 'visual',
      description:
        'Optional. When set, suggestion scripts use this exact Unsplash search string instead of the auto-built query (helpful when the species name is ambiguous or non-local). Clear when you want auto queries again.',
      validation: (Rule) => [Rule.max(200).warning('Keep queries concise for better matches.')],
    }),
    defineField({
      name: 'suggestedCoverSearchQueryLast',
      title: 'Last Unsplash search query (auto)',
      type: 'string',
      group: 'visual',
      readOnly: true,
      description: 'Filled by the suggestion script so editors can see what was searched.',
    }),
    defineField({
      name: 'suggestedCoverSearchPage',
      title: 'Unsplash search results page',
      type: 'number',
      group: 'visual',
      readOnly: true,
      initialValue: 1,
      validation: (Rule) => [
        Rule.min(1).max(10).error('Unsplash pagination is capped between 1 and 10.'),
      ],
      description:
        'Which Unsplash search results page the last suggestion used. Regenerate bumps this to fetch the next image.',
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
      name: 'cardImage',
      title: 'Card image (published on dashboard)',
      type: 'image',
      group: 'visual',
      options: {hotspot: true},
      description:
        'This is how you “approve” a suggested photo for the live site: add the image here using the Unsplash asset picker (pick the same photo) or upload your own. The dashboard uses this Sanity-hosted image, not the temporary preview URL above.',
    }),
    defineField({
      name: 'cardImageAlt',
      title: 'Card image alt text',
      type: 'string',
      group: 'visual',
      description:
        'Short description of the photograph for screen readers. You can paste from Suggested alt text (draft) above, then edit for accuracy.',
      validation: (Rule) => [
        Rule.max(200).warning('Keep image alt text concise (under ~200 characters).'),
      ],
    }),
    defineField({
      name: 'imageSuggestionStatus',
      title: 'Suggestion workflow',
      type: 'string',
      group: 'visual',
      initialValue: 'none',
      options: {
        list: [
          {
            title: 'Done — no open suggestion (use after Card image is set)',
            value: 'none',
          },
          {
            title: 'Review pending — script filled preview fields; add Card image + alt to publish',
            value: 'pending_review',
          },
          {
            title: 'Dismissed — reject suggestion; do not auto-suggest again for this sighting',
            value: 'dismissed',
          },
        ],
        layout: 'radio',
      },
      description:
        'There is no separate Approve toggle. **To accept:** set Card image + Card image alt, then choose **Done — no open suggestion** and Publish. **Wrong photo while pending:** run `npm run birding:regenerate-unsplash`, or fill Unsplash search query (manual override), or choose Dismissed. Scripts: `npm run birding:suggest-unsplash` / `npm run birding:regenerate-unsplash`.',
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
