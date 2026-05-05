import {defineField, defineType} from 'sanity'

/**
 * Reusable “tool / project” page: external API + map/table style routes (e.g. /runs).
 * Add a new `projectKey` value, a matching singleton `_id` (e.g. toolProjectPage-foo), and route code.
 */
export const toolProjectPage = defineType({
  name: 'toolProjectPage',
  title: 'Tool / project page',
  type: 'document',
  groups: [
    {name: 'content', title: 'Page content', default: true},
    {name: 'operations', title: 'Site operations'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'projectKey',
      title: 'Project',
      type: 'string',
      group: 'content',
      options: {
        list: [
          {title: 'Runs (Strava) — /runs', value: 'runs'},
          {title: 'Flights (TripIt) — /flights', value: 'flights'},
          {title: 'Birding Dashboard — /birding-dashboard', value: 'birding-dashboard'},
        ],
        layout: 'radio',
      },
      initialValue: 'runs',
      validation: (Rule) => Rule.required(),
      description: 'Which app route reads this document. Must match the document’s fixed ID in code.',
    }),
    defineField({
      name: 'pageTitle',
      title: 'Page title',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required(),
      description: 'Main heading (H1).',
    }),
    defineField({
      name: 'heroIntroduction',
      title: 'Introduction (under data attribution)',
      type: 'blockContent',
      group: 'content',
      description:
        'Shown below data-source attribution in the hero. On /runs: intro copy (map/table use the last 365-day window). Strava connect & sync live on the password-protected /admin/strava page — see Site operations.',
    }),
    defineField({
      name: 'runsStravaAdminDashboardUrl',
      title: 'Strava sync — admin page URL',
      type: 'url',
      group: 'operations',
      hidden: ({document}) => document?.projectKey !== 'runs',
      description:
        'Open this in your browser to connect Strava and sync runs into the database (sign in at /admin/login on that site if required). Format: https://your-domain.com/admin/strava — local dev: http://localhost:3000/admin/strava',
    }),
    defineField({
      name: 'birdingDashboardUrl',
      title: 'Birding Dashboard — page URL',
      type: 'url',
      group: 'operations',
      hidden: ({document}) => document?.projectKey !== 'birding-dashboard',
      description:
        'Open this URL to trigger an eBird sync from the dashboard. Uses the geographic area and days-back window from Studio → Birding Dashboard sync scope (eBird). Format: https://your-domain.com/birding-dashboard — local dev: http://localhost:3000/birding-dashboard',
    }),
    defineField({
      name: 'mapSectionTitle',
      title: 'Map section title',
      type: 'string',
      group: 'content',
      initialValue: 'Map',
      hidden: ({document}) => document?.projectKey !== 'runs',
      description: 'Heading above the map (H2).',
    }),
    defineField({
      name: 'mapSectionIntroduction',
      title: 'Map section introduction',
      type: 'blockContent',
      group: 'content',
      hidden: ({document}) => document?.projectKey !== 'runs',
      description: 'Paragraph(s) above the map widget.',
    }),
    defineField({
      name: 'tableSectionTitle',
      title: 'Table section title',
      type: 'string',
      group: 'content',
      initialValue: 'Recent runs',
      hidden: ({document}) => document?.projectKey !== 'runs',
      description: 'Heading above the data table (H2).',
    }),
    defineField({
      name: 'tableSectionIntroduction',
      title: 'Table section introduction',
      type: 'blockContent',
      group: 'content',
      hidden: ({document}) => document?.projectKey !== 'runs',
      description: 'Paragraph(s) above the table.',
    }),
    defineField({
      name: 'birdingSightingsTitle',
      title: 'Sightings section title',
      type: 'string',
      group: 'content',
      initialValue: 'Recent sightings',
      hidden: ({document}) => document?.projectKey !== 'birding-dashboard',
      description: 'Heading (H2) above the bird card grid on the Birding Dashboard.',
    }),
    defineField({
      name: 'birdingSightingsIntroduction',
      title: 'Sightings section introduction',
      type: 'blockContent',
      group: 'content',
      hidden: ({document}) => document?.projectKey !== 'birding-dashboard',
      description:
        'Optional copy above the card grid — context about accessibility enrichment, photo credit workflow, etc.',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
    }),
  ],
  preview: {
    select: {
      title: 'pageTitle',
      key: 'projectKey',
    },
    prepare({title, key}) {
      return {
        title: title || 'Tool page',
        subtitle: key ? `project: ${key}` : 'No project key',
      }
    },
  },
})
