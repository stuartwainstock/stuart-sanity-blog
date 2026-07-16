import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {unsplashImageAsset} from 'sanity-plugin-asset-source-unsplash'
import {
  author,
  axisTagValue,
  birdSighting,
  blockContent,
  caseStudy,
  caseStudyAccess,
  category,
  contentHub,
  creditedImage,
  hubLink,
  labHub,
  homepage,
  ebirdBirding,
  ebirdDashboard,
  link,
  page,
  post,
  resource,
  seo,
  siteSettings,
  specimenPalette,
  specimenPaletteRoles,
  toolProjectPage,
  typeEmotion,
  variableFontAxis,
  variableFontFace,
} from './schemaTypes'

// Studio runs as static assets in production, so env vars are baked at build time.
// Prefer Sanity's `SANITY_STUDIO_` prefix (exposed to the Studio bundle), but keep
// `NEXT_PUBLIC_` fallbacks for embedded / Next-hosted builds.
const projectId =
  process.env.SANITY_STUDIO_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ojv692hs'
const dataset =
  process.env.SANITY_STUDIO_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

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
              .title('Birding Dashboard sync scope (eBird)')
              .id('ebirdDashboard')
              .child(
                S.document()
                  .schemaType('ebirdDashboard')
                  .documentId('ebirdDashboard')
              ),
            S.listItem()
              .title('Birding Dashboard — /birding-dashboard')
              .id('toolProjectPage-birding-dashboard')
              .child(
                S.document()
                  .schemaType('toolProjectPage')
                  .documentId('toolProjectPage-birding-dashboard')
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
              .title('Type Emotions')
              .child(
                S.list()
                  .title('Type Emotions')
                  .items([
                    S.listItem()
                      .title('Type Emotions — /type-emotions')
                      .id('toolProjectPage-type-emotions')
                      .child(
                        S.document()
                          .schemaType('toolProjectPage')
                          .documentId('toolProjectPage-type-emotions')
                      ),
                    S.listItem()
                      .title('Emotions')
                      .schemaType('typeEmotion')
                      .child(
                        S.documentTypeList('typeEmotion')
                          .title('Emotions')
                          .defaultOrdering([{field: 'label', direction: 'asc'}])
                      ),
                    S.listItem()
                      .title('Variable fonts')
                      .schemaType('variableFontFace')
                      .child(
                        S.documentTypeList('variableFontFace')
                          .title('Variable fonts')
                          .defaultOrdering([{field: 'label', direction: 'asc'}])
                      ),
                    S.listItem()
                      .title('Specimen palettes')
                      .schemaType('specimenPalette')
                      .child(
                        S.documentTypeList('specimenPalette')
                          .title('Specimen palettes')
                          .defaultOrdering([{field: 'label', direction: 'asc'}])
                      ),
                  ])
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
            S.listItem()
              .title('Bird Sightings (Birding Dashboard)')
              .schemaType('birdSighting')
              .child(
                S.documentTypeList('birdSighting')
                  .title('Bird Sightings')
                  .defaultOrdering([{field: 'observedOn', direction: 'desc'}])
              ),
            S.divider(),
            S.listItem()
              .title('Case Studies (password-protected)')
              .schemaType('caseStudy')
              .child(S.documentTypeList('caseStudy').title('Case Studies')),
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
  ],
  schema: {
    types: [
      author,
      axisTagValue,
      birdSighting,
      blockContent,
      caseStudy,
      caseStudyAccess,
      category,
      creditedImage,
      contentHub,
      hubLink,
      labHub,
      homepage,
      ebirdBirding,
      ebirdDashboard,
      link,
      page,
      post,
      resource,
      seo,
      siteSettings,
      specimenPalette,
      specimenPaletteRoles,
      toolProjectPage,
      typeEmotion,
      variableFontAxis,
      variableFontFace,
    ],
  },
})
