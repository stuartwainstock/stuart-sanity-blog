import {defineField, defineType} from 'sanity'
import {LockIcon} from '@sanity/icons'
import {AccessPasswordInput} from './accessPasswordInput'
import {PdfProtectionInput} from './pdfProtectionInput'

/**
 * Non-secret Studio flag only. Salt/hash live in private Supabase
 * (`case_study_access`), set via /api/admin/case-studies/[slug]/access.
 */
export const caseStudyAccess = defineType({
  name: 'caseStudyAccess',
  title: 'Access password',
  type: 'object',
  components: {input: AccessPasswordInput},
  fields: [
    defineField({
      name: 'configured',
      type: 'string',
      readOnly: true,
      options: {
        list: [
          {title: 'Yes', value: 'yes'},
          {title: 'No', value: 'no'},
        ],
        layout: 'radio',
      },
      description: 'Set by the password control — credentials are stored privately, not in this dataset.',
    }),
  ],
})

/**
 * Non-secret Studio flag for a PDF stored in private Supabase Storage.
 * Bytes are never uploaded to Sanity CDN.
 */
export const caseStudyPdfProtection = defineType({
  name: 'caseStudyPdfProtection',
  title: 'Protected PDF',
  type: 'object',
  components: {input: PdfProtectionInput},
  fields: [
    defineField({
      name: 'configured',
      type: 'string',
      readOnly: true,
      options: {
        list: [
          {title: 'Yes', value: 'yes'},
          {title: 'No', value: 'no'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'originalFilename',
      type: 'string',
      readOnly: true,
      description: 'Filename recorded when the PDF was uploaded to private storage.',
    }),
  ],
})

export const caseStudy = defineType({
  name: 'caseStudy',
  title: 'Case study',
  type: 'document',
  icon: LockIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'access', title: 'Access', icon: LockIcon},
    {name: 'seo', title: 'SEO'},
  ],
  fieldsets: [{name: 'meta', title: 'Project details', options: {columns: 2}}],
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      group: 'content',
      validation: (Rule) =>
        Rule.required().error('A title identifies the case study and labels its page.'),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'content',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required().error('A slug builds the /case-studies URL.'),
    }),
    defineField({
      name: 'client',
      type: 'string',
      group: 'content',
      fieldset: 'meta',
      description: 'Optional. The client or company this work was for.',
    }),
    defineField({
      name: 'year',
      type: 'string',
      group: 'content',
      fieldset: 'meta',
      description: 'Optional. e.g. 2025.',
    }),
    defineField({
      name: 'role',
      type: 'string',
      group: 'content',
      description: 'Optional. Your role on the project.',
    }),
    defineField({
      name: 'liveUrl',
      title: 'Live project URL',
      type: 'url',
      group: 'content',
      description:
        'Optional. Link to the live project or site. Shown as a “Visit live project” button on the case study page.',
      validation: (Rule) => Rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'summary',
      type: 'text',
      rows: 3,
      group: 'content',
      description: 'Short public teaser shown before the visitor unlocks the PDF.',
      validation: (Rule) => Rule.max(300).warning('Keep the teaser under ~300 characters.'),
    }),
    defineField({
      name: 'overview',
      title: 'Public overview',
      type: 'blockContent',
      group: 'content',
      description: 'Optional richer public copy shown above the password prompt.',
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      group: 'content',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          validation: (Rule) =>
            Rule.required().error('Alt text is required for accessibility.'),
        }),
      ],
      description: 'Shown on the listing card and the gate page hero.',
    }),
    defineField({
      name: 'access',
      title: 'Access password',
      type: 'caseStudyAccess',
      group: 'access',
      validation: (Rule) =>
        Rule.required().custom((value) => {
          const access = value as {configured?: string} | undefined
          if (access?.configured === 'yes') return true
          return 'Set a password (stored privately) so the case study is protected.'
        }),
    }),
    defineField({
      name: 'pdfProtection',
      title: 'Protected PDF',
      type: 'caseStudyPdfProtection',
      group: 'access',
      validation: (Rule) =>
        Rule.required().custom((value) => {
          const pdf = value as {configured?: string} | undefined
          if (pdf?.configured === 'yes') return true
          return 'Upload the case study PDF to private storage.'
        }),
      description:
        'PDF bytes are stored in private Supabase Storage and served only after unlock — not on Sanity CDN.',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
      description: 'Case studies are gated — keep “Hide from search engines” ON.',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      client: 'client',
      media: 'coverImage',
      accessConfigured: 'access.configured',
      pdfConfigured: 'pdfProtection.configured',
    },
    prepare({title, client, media, accessConfigured, pdfConfigured}) {
      const protectedPart =
        accessConfigured === 'yes' && pdfConfigured === 'yes' ? 'Protected' : 'Incomplete protection'
      const clientPart = client ? `${client} • ` : ''
      return {
        title: title || 'Untitled case study',
        subtitle: `${clientPart}${protectedPart}`,
        media,
      }
    },
  },
})
