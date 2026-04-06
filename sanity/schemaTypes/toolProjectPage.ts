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
          // Add entries when you add new tool routes + singleton documents.
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
        'Shown below Strava / API attribution and above the connection panel. Mention sync, Supabase, and the rolling window if relevant.',
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
      name: 'mapSectionIntroduction',
      title: 'Map section introduction',
      type: 'blockContent',
      group: 'content',
      description: 'Paragraph(s) above the map widget.',
    }),
    defineField({
      name: 'tableSectionTitle',
      title: 'Table section title',
      type: 'string',
      group: 'content',
      initialValue: 'Recent runs',
      description: 'Heading above the data table (H2).',
    }),
    defineField({
      name: 'tableSectionIntroduction',
      title: 'Table section introduction',
      type: 'blockContent',
      group: 'content',
      description: 'Paragraph(s) above the table.',
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
