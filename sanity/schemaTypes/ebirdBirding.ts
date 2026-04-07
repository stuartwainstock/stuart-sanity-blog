import {defineField, defineType} from 'sanity'

/**
 * Singleton: Pileated Watch page copy + eBird API settings.
 * Map and sightings table share one fetch. Requires EBIRD_API_KEY on the server.
 */
export const ebirdBirding = defineType({
  name: 'ebirdBirding',
  title: 'Pileated Watch (eBird)',
  type: 'document',
  groups: [
    {name: 'content', title: 'Page content', default: true},
    {name: 'integration', title: 'eBird API'},
    {name: 'map', title: 'Map defaults'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'mapPageTitle',
      title: 'Page title',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required(),
      description: 'Main heading on /pileated-watch (e.g. Pileated Watch).',
    }),
    defineField({
      name: 'mapPageIntroduction',
      title: 'Page introduction',
      type: 'blockContent',
      group: 'content',
      description:
        'Shown under the title, above the map. Mention the focus species, area, and recent window.',
    }),
    defineField({
      name: 'mapSectionTitle',
      title: 'Map section title',
      type: 'string',
      group: 'content',
      initialValue: 'Map',
      description: 'Heading above the map (H2).',
    }),
    defineField({
      name: 'sightingsSectionTitle',
      title: 'Sightings section title',
      type: 'string',
      group: 'content',
      initialValue: 'Sightings',
      description: 'Heading above the sightings table (H2).',
    }),
    defineField({
      name: 'sightingsIntroduction',
      title: 'Sightings introduction',
      type: 'blockContent',
      group: 'content',
      description: 'Shown under the sightings heading, above the table.',
    }),
    defineField({
      name: 'mapDataSource',
      title: 'Geographic area',
      type: 'string',
      group: 'integration',
      options: {
        list: [
          {title: 'Hotspot location ID(s)', value: 'hotspots'},
          {title: 'Region code', value: 'region'},
        ],
        layout: 'radio',
      },
      initialValue: 'hotspots',
      validation: (Rule) => Rule.required(),
      description:
        'Hotspots: L-codes. Region: e.g. US-NY-109. Used for map and sightings table.',
    }),
    defineField({
      name: 'hotspotCodes',
      title: 'Hotspot codes (L…)',
      type: 'text',
      rows: 4,
      group: 'integration',
      description:
        'One eBird hotspot ID per line or comma-separated (e.g. L1234567). Used when geographic area is Hotspots.',
    }),
    defineField({
      name: 'regionCode',
      title: 'Region code',
      type: 'string',
      group: 'integration',
      description:
        'When geographic area is Region: country (US), subnational (US-NY), or county (US-NY-109).',
    }),
    defineField({
      name: 'focusSpeciesCode',
      title: 'Focus species (eBird code)',
      type: 'string',
      group: 'integration',
      initialValue: 'pilwoo',
      validation: (Rule) => Rule.required(),
      description:
        'eBird species code, e.g. pilwoo (Pileated Woodpecker). See eBird taxonomy.',
    }),
    defineField({
      name: 'focusSpeciesCommonName',
      title: 'Focus species (display name)',
      type: 'string',
      group: 'integration',
      initialValue: 'Pileated Woodpecker',
      description:
        'Shown in UI copy; does not affect the API (the code above does).',
    }),
    defineField({
      name: 'recentDaysBack',
      title: 'Days of recent sightings',
      type: 'number',
      group: 'integration',
      initialValue: 30,
      validation: (Rule) => Rule.required().min(1).max(30),
      description: 'eBird recent window (max 30 days).',
    }),
    defineField({
      name: 'maxObservationsToFetch',
      title: 'Max sighting rows to load',
      type: 'number',
      group: 'integration',
      initialValue: 500,
      validation: (Rule) => Rule.required().min(1).max(10000),
      description:
        'Caps rows after merging hotspots. Higher values mean more API payload.',
    }),
    defineField({
      name: 'defaultMapLatitude',
      title: 'Default map center (latitude)',
      type: 'number',
      group: 'map',
      description: 'When there are no coordinates in the recent window.',
    }),
    defineField({
      name: 'defaultMapLongitude',
      title: 'Default map center (longitude)',
      type: 'number',
      group: 'map',
    }),
    defineField({
      name: 'defaultMapZoom',
      title: 'Default zoom',
      type: 'number',
      group: 'map',
      initialValue: 13,
      validation: (Rule) => Rule.min(1).max(20),
    }),
    defineField({
      name: 'seoMap',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
    }),
  ],
  preview: {
    select: {title: 'mapPageTitle'},
    prepare({title}) {
      return {title: title || 'Pileated Watch (eBird)'}
    },
  },
})
