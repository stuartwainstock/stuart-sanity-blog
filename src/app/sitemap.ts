import type { MetadataRoute } from 'next'
import { sanityClient } from '@/lib/sanity'
import {
  SITE_URL_QUERY,
  SITEMAP_POSTS_QUERY,
  SITEMAP_PAGES_QUERY,
  SITEMAP_CATEGORIES_QUERY,
  SITEMAP_AUTHORS_QUERY,
} from '@/lib/queries'

// Keep the sitemap fresh without rebuilding: regenerate at most hourly.
export const revalidate = 3600

const FALLBACK_BASE_URL = 'https://www.stuartwainstock.com'

// Case studies (`caseStudy`) are intentionally excluded: they are password-gated
// and rendered with `robots: noindex`, so they must not be advertised here.
//
// Routes not backed by a Sanity slug document (hardcoded app routes).
const STATIC_PATHS = [
  '',
  '/blog',
  '/journal',
  '/pileated-watch',
  '/runs',
  '/flights',
  '/birding-dashboard',
] as const

type SlugDoc = { slug: string; _updatedAt?: string }

function resolveBaseUrl(siteUrl: string | null): string {
  try {
    return new URL(siteUrl || FALLBACK_BASE_URL).origin
  } catch {
    return FALLBACK_BASE_URL
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [siteUrl, posts, pages, categories, authors] = await Promise.all([
    sanityClient.fetch<string | null>(SITE_URL_QUERY).catch(() => null),
    sanityClient.fetch<SlugDoc[]>(SITEMAP_POSTS_QUERY).catch(() => []),
    sanityClient.fetch<SlugDoc[]>(SITEMAP_PAGES_QUERY).catch(() => []),
    sanityClient.fetch<SlugDoc[]>(SITEMAP_CATEGORIES_QUERY).catch(() => []),
    sanityClient.fetch<SlugDoc[]>(SITEMAP_AUTHORS_QUERY).catch(() => []),
  ])

  const baseUrl = resolveBaseUrl(siteUrl)
  const now = new Date()

  const lastModified = (value?: string) => (value ? new Date(value) : now)

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }))

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/journal/${post.slug}`,
    lastModified: lastModified(post._updatedAt),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  const pageEntries: MetadataRoute.Sitemap = pages.map((page) => ({
    url: `${baseUrl}/${page.slug}`,
    lastModified: lastModified(page._updatedAt),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}/category/${category.slug}`,
    lastModified: lastModified(category._updatedAt),
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  const authorEntries: MetadataRoute.Sitemap = authors.map((author) => ({
    url: `${baseUrl}/author/${author.slug}`,
    lastModified: lastModified(author._updatedAt),
    changeFrequency: 'monthly',
    priority: 0.4,
  }))

  return [
    ...staticEntries,
    ...postEntries,
    ...pageEntries,
    ...categoryEntries,
    ...authorEntries,
  ]
}
