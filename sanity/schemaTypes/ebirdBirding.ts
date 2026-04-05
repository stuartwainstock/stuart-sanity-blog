import {defineField, defineType} from 'sanity'

/**
 * Singleton: copy + eBird API settings. Map and sightings list use the same
 * region/hotspots and focus species. Requires EBIRD_API_KEY on the server.
 */
export const ebirdBirding = defineType({
  name: 'ebirdBirding',
  title: 'Birding (eBird)',
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
      title: 'Map page title',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'mapPageIntroduction',
      title: 'Map page introduction',
      type: 'blockContent',
      group: 'content',
      description:
        'Shown above the map. Mention the focus species, your region or hotspots, and the recent window.',
    }),
    defineField({
      name: 'lifeListPageTitle',
      title: 'Sightings list page title',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required(),
      description:
        'Heading for /backyard-birds/life-list — same eBird rows as the map, table only.',
    }),
    defineField({
      name: 'lifeListIntroduction',
      title: 'Sightings list introduction',
      type: 'blockContent',
      group: 'content',
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
        'Map and sightings list both use this area. Hotspots: L-codes. Region: e.g. US-NY-109.',
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
        'eBird species code, e.g. pilwoo (Pileated Woodpecker). Map and list show recent sightings of this species only. See eBird taxonomy.',
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
      description:
        'eBird recent window (max 30 days). Same window for map and list.',
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
      title: 'SEO (map page)',
      type: 'seo',
      group: 'seo',
    }),
    defineField({
      name: 'seoLifeList',
      title: 'SEO (sightings list page)',
      type: 'seo',
      group: 'seo',
    }),
  ],
  preview: {
    select: {title: 'mapPageTitle'},
    prepare({title}) {
      return {title: title || 'Birding (eBird)'}
    },
  },
})
