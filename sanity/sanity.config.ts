import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {unsplashImageAsset} from 'sanity-plugin-asset-source-unsplash'
import {googleAnalyticsPlugin} from 'sanity-plugin-ga-dashboard'
import {
  author,
  blockContent,
  category,
  homepage,
  ebirdBirding,
  link,
  page,
  post,
  resource,
  seo,
  siteSettings,
  toolProjectPage,
} from './schemaTypes'

// Studio runs as static assets in production, so env vars are baked at build time.
// Prefer Sanity's `SANITY_STUDIO_` prefix (exposed to the Studio bundle), but keep
// `NEXT_PUBLIC_` fallbacks for embedded / Next-hosted builds.
const projectId =
  process.env.SANITY_STUDIO_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ojv692hs'
const dataset =
  process.env.SANITY_STUDIO_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

/**
 * GA dashboard proxy for `sanity-plugin-ga-dashboard`.
 * Relative `/api/analytics` on hosted `*.sanity.studio` resolves against Sanity’s origin and redirects to
 * sanity.io — CORS fails. Use your live Next origin when building Studio via `sanity deploy` (no VERCEL).
 *
 * Note: `/api/analytics` is protected server-side. For hosted Studio builds, include the shared secret
 * in `NEXT_PUBLIC_SANITY_GA_API_URL` as `?secret=...` (or send `x-analytics-proxy-secret`).
 */
const PRODUCTION_SITE_ORIGIN = 'https://www.stuartwainstock.com'

const gaAnalyticsApiUrl = (() => {
  const explicit =
    process.env.SANITY_STUDIO_GA_API_URL?.trim() ?? process.env.NEXT_PUBLIC_SANITY_GA_API_URL?.trim()
  if (explicit) return explicit
  if (process.env.VERCEL) return '/api/analytics'
  if (process.env.NODE_ENV !== 'production') return '/api/analytics'
  return `${PRODUCTION_SITE_ORIGIN}/api/analytics`
})()

export default defineConfig({
  name: 'default',
  title: 'Blog CMS',
  projectId,
  dataset,
  basePath: '/studio', // This is important for the studio route
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Homepage')
              .id('homepage')
              .child(
                S.document()
                  .schemaType('homepage')
                  .documentId('homepage')
              ),
            S.listItem()
              .title('Site Settings')
              .id('siteSettings')
              .child(
                S.document()
                  .schemaType('siteSettings')
                  .documentId('siteSettings')
              ),
            S.listItem()
              .title('Pileated Watch (eBird)')
              .id('ebirdBirding')
              .child(
                S.document()
                  .schemaType('ebirdBirding')
                  .documentId('ebirdBirding')
              ),
            S.listItem()
              .title('Runs (Strava · sync: Site operations tab)')
              .id('toolProjectPage-runs')
              .child(
                S.document()
                  .schemaType('toolProjectPage')
                  .documentId('toolProjectPage-runs')
              ),
            S.listItem()
              .title('Flights (TripIt)')
              .id('toolProjectPage-flights')
              .child(
                S.document()
                  .schemaType('toolProjectPage')
                  .documentId('toolProjectPage-flights')
              ),
            S.divider(),
            S.listItem()
              .title('Blog Posts')
              .schemaType('post')
              .child(S.documentTypeList('post').title('Blog Posts')),
            S.listItem()
              .title('Pages')
              .schemaType('page')
              .child(S.documentTypeList('page').title('Pages')),
            S.listItem()
              .title('Links')
              .schemaType('link')
              .child(S.documentTypeList('link').title('Links')),
            S.listItem()
              .title('Resources')
              .schemaType('resource')
              .child(
                S.list()
                  .title('Resources')
                  .items([
                    S.listItem()
                      .title('All Resources')
                      .child(
                        S.documentTypeList('resource')
                          .title('All Resources')
                          .defaultOrdering([{field: 'addedDate', direction: 'desc'}])
                      ),
                    S.listItem()
                      .title('Inbox')
                      .child(
                        S.documentList()
                          .title('Inbox Resources')
                          .schemaType('resource')
                          .filter('_type == "resource" && status == "inbox"')
                          .defaultOrdering([{field: 'addedDate', direction: 'desc'}])
                      ),
                    S.listItem()
                      .title('Reviewed')
                      .child(
                        S.documentList()
                          .title('Reviewed Resources')
                          .schemaType('resource')
                          .filter('_type == "resource" && status == "reviewed"')
                          .defaultOrdering([{field: 'addedDate', direction: 'desc'}])
                      ),
                    S.listItem()
                      .title('Published')
                      .child(
                        S.documentList()
                          .title('Published Resources')
                          .schemaType('resource')
                          .filter('_type == "resource" && status == "published"')
                          .defaultOrdering([{field: 'addedDate', direction: 'desc'}])
                      ),
                    S.listItem()
                      .title('Rejected (Delete Queue)')
                      .child(
                        S.documentList()
                          .title('Rejected Resources (Queued for Deletion)')
                          .schemaType('resource')
                          .filter('_type == "resource" && status == "rejected"')
                          .defaultOrdering([{field: 'addedDate', direction: 'desc'}])
                      ),
                  ])
              ),
            S.divider(),
            S.listItem()
              .title('Authors')
              .schemaType('author')
              .child(S.documentTypeList('author').title('Authors')),
            S.listItem()
              .title('Categories')
              .schemaType('category')
              .child(S.documentTypeList('category').title('Categories')),
          ]),
    }),
    visionTool(),
    unsplashImageAsset(),
    googleAnalyticsPlugin({
      apiUrl: gaAnalyticsApiUrl,
      disabled: process.env.SANITY_DISABLE_GA_DASHBOARD === '1',
    }),
  ],
  schema: {
    types: [
      author,
      blockContent,
      category,
      homepage,
      ebirdBirding,
      link,
      page,
      post,
      resource,
      seo,
      siteSettings,
      toolProjectPage,
    ],
  },
})
