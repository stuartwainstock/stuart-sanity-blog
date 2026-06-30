import {defineField, defineType} from 'sanity'
import {LockIcon} from '@sanity/icons'
import {AccessPasswordInput} from './accessPasswordInput'

/**
 * Stores the share-password protection for a case study as a random salt and a
 * one-way SHA-256(salt:password) hash. Edited through {@link AccessPasswordInput};
 * verified server-side in src/lib/caseStudy/password.ts (formula must match).
 */
export const caseStudyAccess = defineType({
  name: 'caseStudyAccess',
  title: 'Access password',
  type: 'object',
  components: {input: AccessPasswordInput},
  fields: [
    defineField({name: 'salt', title: 'Salt', type: 'string', readOnly: true}),
    defineField({name: 'hash', title: 'Hash', type: 'string', readOnly: true}),
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
      name: 'pdfFile',
      title: 'PDF',
      type: 'file',
      group: 'content',
      options: {accept: 'application/pdf'},
      validation: (Rule) => Rule.required().error('Upload the case study PDF.'),
      description:
        'The protected PDF. Served only through an authenticated viewer after the password is entered.',
    }),
    defineField({
      name: 'access',
      title: 'Access password',
      type: 'caseStudyAccess',
      group: 'access',
      validation: (Rule) =>
        Rule.required().custom((value) => {
          const access = value as {salt?: string; hash?: string} | undefined
          if (access?.salt && access?.hash) return true
          return 'Set a password so the case study is protected.'
        }),
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
      hash: 'access.hash',
    },
    prepare({title, client, media, hash}) {
      const protectedPart = hash ? 'Protected' : 'No password'
      const clientPart = client ? `${client} • ` : ''
      return {
        title: title || 'Untitled case study',
        subtitle: `${clientPart}${protectedPart}`,
        media,
      }
    },
  },
})
