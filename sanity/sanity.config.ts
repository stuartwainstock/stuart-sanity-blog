import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {unsplashImageAsset} from 'sanity-plugin-asset-source-unsplash'
import {author, blockContent, category, homepage, link, page, post, seo, siteSettings} from './schemaTypes'

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
    types: [author, blockContent, category, homepage, link, page, post, seo, siteSettings],
  },
})
