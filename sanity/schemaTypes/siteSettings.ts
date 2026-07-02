import {defineField, defineType} from 'sanity'

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
      type: 'creditedImage',
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
      title: 'Lab hub',
      type: 'labHub',
      description:
        'Lab hub page (/lab) and header link. Child projects appear as cards on the hub — not in the main nav dropdown.',
    }),
    defineField({
      name: 'caseStudiesHub',
      title: 'Case studies hub',
      type: 'contentHub',
      description:
        'Case studies hub page (/case-studies) and header link. Child case studies are published as Case Study documents.',
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
