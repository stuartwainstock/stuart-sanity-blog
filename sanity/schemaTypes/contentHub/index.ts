import {defineArrayMember, defineField, defineType} from 'sanity'

/** Shared hub link item — used on hub listing pages (not in the main nav). */
export const hubLink = defineType({
  name: 'hubLink',
  title: 'Hub link',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Label',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'href',
      title: 'URL',
      type: 'string',
      description:
        'Site path starting with / (e.g. /runs), or full https:// URL for an external project (opens in a new tab).',
      validation: (Rule) =>
        Rule.required().custom((val) => {
          if (typeof val !== 'string' || !val) return true
          const t = val.trim()
          if (/^https?:\/\//i.test(t)) {
            try {
              const u = new URL(t)
              if (u.protocol !== 'http:' && u.protocol !== 'https:') {
                return 'Use an http:// or https:// URL'
              }
              return true
            } catch {
              return 'Enter a valid http:// or https:// URL'
            }
          }
          if (!t.startsWith('/')) {
            return 'Use a site path starting with / or a full https:// URL'
          }
          if (t.startsWith('//')) {
            return 'Use a site path like /my-project or https://example.com'
          }
          return true
        }),
    }),
  ],
  preview: {
    select: {title: 'title', href: 'href'},
    prepare({title, href}) {
      return {
        title: title || 'Untitled',
        subtitle: href,
      }
    },
  },
})

/** Shared hub page + nav link fields (children are hub-specific). */
export const contentHubFields = [
  defineField({
    name: 'label',
    title: 'Nav label',
    type: 'string',
    description: 'Shown in the main header (e.g. Lab, Case studies)',
    validation: (Rule) =>
      Rule.warning('Set a nav label when this hub should appear in the header or on its listing page'),
  }),
  defineField({
    name: 'href',
    title: 'Hub page path',
    type: 'string',
    description: 'Site path for the nav link and hub page (e.g. /lab, /case-studies).',
    validation: (Rule) =>
      Rule.custom((val) => {
        if (val == null || val === '') return true
        if (typeof val !== 'string') return 'Enter a site path starting with /'
        const t = val.trim()
        if (!t.startsWith('/') || t.startsWith('//')) {
          return 'Use a site path like /lab'
        }
        return true
      }),
  }),
  defineField({
    name: 'hubTitle',
    title: 'Hub page title',
    type: 'string',
    description: 'H1 on the hub page. Falls back to the nav label when empty.',
  }),
  defineField({
    name: 'hubIntroduction',
    title: 'Hub page introduction',
    type: 'blockContent',
    description: 'Intro copy shown under the hub page title.',
  }),
  defineField({
    name: 'seo',
    title: 'Hub page SEO',
    type: 'seo',
    description: 'SEO metadata for the hub listing page.',
  }),
  defineField({
    name: 'showInNavigation',
    title: 'Show in navigation',
    type: 'string',
    options: {
      list: [
        {title: 'Yes', value: 'true'},
        {title: 'No', value: 'false'},
      ],
      layout: 'radio',
    },
    initialValue: 'true',
    description: 'When Yes, this hub appears as a top-level link in the main header.',
  }),
  defineField({
    name: 'navigationOrder',
    title: 'Navigation order',
    type: 'number',
    description: 'Order among hub links in the header (lower numbers appear first).',
    initialValue: 10,
  }),
]

export const contentHub = defineType({
  name: 'contentHub',
  title: 'Content hub',
  type: 'object',
  fields: contentHubFields,
})

/** Lab hub — curated child links on the hub page. */
export const labHub = defineType({
  name: 'labHub',
  title: 'Lab hub',
  type: 'object',
  fields: [
    ...contentHubFields,
    defineField({
      name: 'items',
      title: 'Hub project links',
      type: 'array',
      description:
        'Cards on the /lab hub page. Use a site path (/runs) or https://… for external projects. Not shown in the main nav.',
      validation: (Rule) => Rule.max(12).warning('Keep the list short for readability'),
      of: [defineArrayMember({type: 'hubLink'})],
    }),
  ],
})
