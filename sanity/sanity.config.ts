import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {unsplashImageAsset} from 'sanity-plugin-asset-source-unsplash'
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

// Studio runs as static assets in production, so env vars may not be present
// at runtime. Keep env override support, but fall back to this project's values.
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ojv692hs'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

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
            S.listItem()
              .title('Flight paths (demo)')
              .id('toolProjectPage-flights-demo')
              .child(
                S.document()
                  .schemaType('toolProjectPage')
                  .documentId('toolProjectPage-flights-demo')
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
