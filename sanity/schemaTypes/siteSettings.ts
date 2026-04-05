import {defineArrayMember, defineField, defineType} from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Site Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Site Description',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'journalDescription',
      title: 'Journal Description',
      type: 'text',
      rows: 3,
      description: 'Description text that appears on the journal page',
      validation: (Rule) => Rule.max(200).warning('Keep it concise for better readability'),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
          description: 'Describe the logo for screen readers. This is required for accessibility.',
          validation: (Rule) => 
            Rule.required()
              .min(10)
              .max(125)
              .warning('Alt text should be 10-125 characters for optimal accessibility'),
        },
        {
          name: 'credit',
          type: 'string',
          title: 'Photo Credit',
          description: 'Credit the photographer (auto-populated for Unsplash images)',
        },
      ],
    }),
    defineField({
      name: 'favicon',
      title: 'Favicon',
      type: 'image',
      description: 'Upload a square image (32x32px recommended)',
    }),
    defineField({
      name: 'url',
      title: 'Site URL',
      type: 'url',
      description: 'The main URL for your site',
    }),
    defineField({
      name: 'social',
      title: 'Social Media',
      type: 'object',
      fields: [
        {
          name: 'twitter',
          title: 'Twitter',
          type: 'string',
        },
        {
          name: 'facebook',
          title: 'Facebook',
          type: 'string',
        },
        {
          name: 'instagram',
          title: 'Instagram',
          type: 'string',
        },
        {
          name: 'linkedin',
          title: 'LinkedIn',
          type: 'string',
        },
        {
          name: 'github',
          title: 'GitHub',
          type: 'string',
        },
      ],
    }),
    defineField({
      name: 'footer',
      title: 'Footer',
      type: 'object',
      fields: [
        {
          name: 'copyright',
          title: 'Copyright Text',
          type: 'string',
        },
        {
          name: 'sections',
          title: 'Footer Sections',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'footerSection',
              title: 'Footer Section',
              fields: [
                {
                  name: 'title',
                  title: 'Section Title',
                  type: 'string',
                  validation: (Rule) => Rule.required(),
                },
                {
                  name: 'links',
                  title: 'Section Links',
                  type: 'array',
                  of: [
                    {
                      type: 'object',
                      fields: [
                        {
                          name: 'title',
                          title: 'Link Title',
                          type: 'string',
                          validation: (Rule) => Rule.required(),
                        },
                        {
                          name: 'url',
                          title: 'Link URL',
                          type: 'string',
                          validation: (Rule) => Rule.required(),
                        },
                        {
                          name: 'external',
                          title: 'External Link',
                          type: 'boolean',
                          description: 'Check if this link opens in a new tab',
                          initialValue: false,
                        },
                      ],
                    },
                  ],
                },
              ],
              preview: {
                select: {
                  title: 'title',
                  subtitle: 'links',
                },
                prepare({ title, subtitle }) {
                  const linkCount = subtitle?.length || 0;
                  return {
                    title: title,
                    subtitle: `${linkCount} link${linkCount !== 1 ? 's' : ''}`,
                  };
                },
              },
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'projectsMenu',
      title: 'Projects menu',
      type: 'object',
      description:
        'Optional “Projects” dropdown in the main header. Each item is a link to a route on this site; APIs (eBird, Strava, etc.) are implemented in code for that route—not here.',
      fields: [
        defineField({
          name: 'label',
          title: 'Top-level label',
          type: 'string',
          initialValue: 'Projects',
          description: 'Shown in the nav bar (e.g. Projects)',
        }),
        defineField({
          name: 'items',
          title: 'Project links',
          type: 'array',
          validation: (Rule) => Rule.max(12).warning('Keep the list short for navigation usability'),
          of: [
            defineArrayMember({
              type: 'object',
              name: 'projectsMenuItem',
              title: 'Project',
              fields: [
                defineField({
                  name: 'title',
                  title: 'Label',
                  type: 'string',
                  validation: (Rule) => Rule.required(),
                }),
                defineField({
                  name: 'href',
                  title: 'Path',
                  type: 'string',
                  description:
                    'Internal URL path starting with / (e.g. /pileated-watch). Use your Next.js app route.',
                  validation: (Rule) =>
                    Rule.required().custom((val) => {
                      if (typeof val !== 'string' || !val) return true
                      const t = val.trim()
                      if (!t.startsWith('/')) return 'Path must start with /'
                      if (t.startsWith('//')) return 'Use a site path like /my-project, not a protocol URL'
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
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'seo',
      title: 'Default SEO',
      type: 'seo',
      description: 'Default SEO settings for the site',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'logo',
    },
  },
})
