import {defineField, defineType} from 'sanity'

/**
 * Singleton: editorial content + integration settings for backyard birding.
 * Observation data is read from the iNaturalist API at request time (cached);
 * Sanity remains the source of truth for copy, filters, and map defaults.
 */
export const inaturalistBackyard = defineType({
  name: 'inaturalistBackyard',
  title: 'Backyard birds (iNaturalist)',
  type: 'document',
  groups: [
    {name: 'content', title: 'Page content', default: true},
    {name: 'integration', title: 'iNaturalist filters'},
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
      description: 'Shown above the map. Explain how sightings are sourced from iNaturalist.',
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
      name: 'inatUserLogin',
      title: 'iNaturalist username',
      type: 'string',
      group: 'integration',
      description:
        'Your public login on iNaturalist. Observations must be public to appear here.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'iconicTaxaName',
      title: 'Taxonomic filter',
      type: 'string',
      group: 'integration',
      initialValue: 'Aves',
      description: 'iNaturalist iconic_taxa_name (e.g. Aves for birds).',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'placeId',
      title: 'Place ID (optional)',
      type: 'number',
      group: 'integration',
      description:
        'iNaturalist place_id to limit observations (e.g. your backyard place). Leave empty to use bounding box or all locations.',
    }),
    defineField({
      name: 'boundingBox',
      title: 'Bounding box (optional)',
      type: 'object',
      group: 'integration',
      description:
        'Alternative to place ID: nelat, nelng, swlat, swlng in decimal degrees. Must be set together if used.',
      fields: [
        defineField({name: 'nelat', title: 'NE latitude', type: 'number'}),
        defineField({name: 'nelng', title: 'NE longitude', type: 'number'}),
        defineField({name: 'swlat', title: 'SW latitude', type: 'number'}),
        defineField({name: 'swlng', title: 'SW longitude', type: 'number'}),
      ],
    }),
    defineField({
      name: 'maxObservationsToFetch',
      title: 'Max observations to load',
      type: 'number',
      group: 'integration',
      initialValue: 500,
      description:
        'Caps API pagination (200 per request). Lower values reduce load on iNaturalist and your deployment.',
      validation: (Rule) => Rule.required().min(1).max(5000),
    }),
    defineField({
      name: 'defaultMapLatitude',
      title: 'Default map center (latitude)',
      type: 'number',
      group: 'map',
      description: 'Used when there are no georeferenced observations yet.',
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
    select: {
      title: 'mapPageTitle',
    },
    prepare({title}) {
      return {title: title || 'Backyard birds'}
    },
  },
})
