import {defineField, defineType} from 'sanity'

/**
 * Singleton: Birding Dashboard sync scope for /birding-dashboard.
 * Keeps the “all-species feed” config separate from the Pileated-focused page config.
 *
 * Requires EBIRD_API_KEY on the server.
 */
export const ebirdDashboard = defineType({
  name: 'ebirdDashboard',
  title: 'Birding Dashboard (eBird)',
  type: 'document',
  groups: [{name: 'integration', title: 'eBird API', default: true}],
  fields: [
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
      initialValue: 'region',
      validation: (Rule) => Rule.required().error('Select hotspots or a region code to define the sync scope.'),
      description:
        'Controls which sightings are synced into Sanity for /birding-dashboard.',
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
      name: 'recentDaysBack',
      title: 'Days of recent sightings',
      type: 'number',
      group: 'integration',
      initialValue: 7,
      validation: (Rule) =>
        Rule.required()
          .min(1)
          .max(30)
          .error('eBird only supports a recent window of 1–30 days.'),
      description: 'eBird recent window (max 30 days).',
    }),
    defineField({
      name: 'maxObservationsToFetch',
      title: 'Max sighting rows to sync',
      type: 'number',
      group: 'integration',
      initialValue: 300,
      validation: (Rule) =>
        Rule.required()
          .min(1)
          .max(10000)
          .error('Choose a max between 1 and 10,000 to cap the sync payload.'),
      description:
        'Caps total observations synced per run (after merging hotspots). Higher values mean more API payload and more documents in Sanity.',
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Birding Dashboard (eBird)'}
    },
  },
})

