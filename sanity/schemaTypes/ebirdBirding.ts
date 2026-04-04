import {defineField, defineType} from 'sanity'

/**
 * Singleton: copy + eBird API settings. Observation rows and species list are
 * fetched from eBird at request time (cached). Requires EBIRD_API_KEY on the server.
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
        'Shown above the map. Mention eBird, your hotspots/region, and the recent window for pins.',
    }),
    defineField({
      name: 'lifeListPageTitle',
      title: 'Life list page title',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'lifeListIntroduction',
      title: 'Life list introduction',
      type: 'blockContent',
      group: 'content',
    }),
    defineField({
      name: 'lifeListSource',
      title: 'Life list: data source',
      type: 'string',
      group: 'integration',
      initialValue: 'location',
      options: {
        list: [
          {
            title: 'Everyone at this place (eBird species list)',
            value: 'location',
          },
          {
            title: 'My checklists only (historic day-by-day)',
            value: 'personal',
          },
        ],
        layout: 'radio',
      },
      validation: (Rule) =>
        Rule.required().custom((value, context) => {
          const parent = context.parent as {
            lifeListObserverDisplayName?: string
            mapObserverDisplayNameFilter?: string
          }
          if (value === 'personal') {
            const name = (
              parent.lifeListObserverDisplayName ||
              parent.mapObserverDisplayNameFilter ||
              ''
            ).trim()
            if (!name) {
              return 'Personal life list needs your eBird display name (Life list observer below, or Map: only this observer).'
            }
          }
          return true
        }),
      description:
        'Location = all-time species reported at the life list hotspot/region (fast). Personal = only species you submitted there, built from eBird historic data (one API call per day in the window below).',
    }),
    defineField({
      name: 'lifeListObserverDisplayName',
      title: 'Life list: your eBird display name (personal mode)',
      type: 'string',
      group: 'integration',
      description:
        'When life list is Personal, rows are kept only when the observer matches this name (case-insensitive). If empty, the map observer filter is used. Must match eBird profile / checklists.',
      hidden: ({parent}) => parent?.lifeListSource !== 'personal',
    }),
    defineField({
      name: 'lifeListHistoricDaysBack',
      title: 'Life list: days of history (personal mode)',
      type: 'number',
      group: 'integration',
      initialValue: 180,
      validation: (Rule) => Rule.required().min(1).max(366),
      hidden: ({parent}) => parent?.lifeListSource !== 'personal',
      description:
        'How many calendar days to scan (today backward). Each day is one eBird request; keep this smaller on slow hosts. First load can take a while; responses are cached ~24h.',
    }),
    defineField({
      name: 'mapDataSource',
      title: 'Map: recent observations source',
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
    }),
    defineField({
      name: 'hotspotCodes',
      title: 'Hotspot codes (L…)',
      type: 'text',
      rows: 4,
      group: 'integration',
      description:
        'One eBird hotspot ID per line or comma-separated (e.g. L1234567). Used when map source is Hotspots. Find IDs on the hotspot’s eBird page URL.',
    }),
    defineField({
      name: 'regionCode',
      title: 'Region code',
      type: 'string',
      group: 'integration',
      description:
        'Used when map source is Region. eBird region codes: country (US), subnational (US-NY), or county (US-NY-109). See eBird region finder.',
    }),
    defineField({
      name: 'lifeListLocationId',
      title: 'Life list: region or hotspot ID',
      type: 'string',
      group: 'integration',
      validation: (Rule) => Rule.required(),
      description:
        'Hotspot (L…) or region (e.g. US-NY). Location life list: passed to product/spplist. Personal life list: passed to historic observations (same place scope).',
    }),
    defineField({
      name: 'recentDaysBack',
      title: 'Map: days of recent checklists',
      type: 'number',
      group: 'integration',
      initialValue: 30,
      validation: (Rule) => Rule.required().min(1).max(30),
      description:
        'eBird recent-observation endpoints use a sliding window (max 30 days). Older sightings won’t appear as pins. A location-sourced life list uses full history at that place; a personal life list uses the separate “days of history” setting.',
    }),
    defineField({
      name: 'maxObservationsToFetch',
      title: 'Max observation rows to load (map)',
      type: 'number',
      group: 'integration',
      initialValue: 500,
      validation: (Rule) => Rule.required().min(1).max(10000),
      description:
        'Caps rows after merging hotspots/region. Higher values mean more API payload.',
    }),
    defineField({
      name: 'mapObserverDisplayNameFilter',
      title: 'Map: only this observer (optional)',
      type: 'string',
      group: 'integration',
      description:
        'If set, only checklist rows from this eBird display name are shown on the map (case-insensitive). Uses detail=full. For a personal life list, this name is used when “Life list: your eBird display name” is empty.',
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
      title: 'SEO (life list page)',
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
