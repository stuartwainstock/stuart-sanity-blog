import type { MetadataRoute } from 'next'
import { sanityClient } from '@/lib/sanity'
import {
  SITE_URL_QUERY,
  SITEMAP_POSTS_QUERY,
  SITEMAP_PAGES_QUERY,
  SITEMAP_CATEGORIES_QUERY,
  SITEMAP_AUTHORS_QUERY,
  SITEMAP_HUBS_QUERY,
} from '@/lib/queries'

// Keep the sitemap fresh without rebuilding: regenerate at most hourly.
export const revalidate = 3600

const FALLBACK_BASE_URL = 'https://www.stuartwainstock.com'

// Individual case study slugs (`/case-studies/[slug]`) are intentionally excluded:
// gate pages are password-protected and always `noindex`.
//
// Hub listing pages (/lab, /case-studies) come from siteSettings via SITEMAP_HUBS_QUERY.
// Tool/project routes below are hardcoded app routes not backed by a slug document.
const STATIC_PATHS = [
  '',
  '/blog',
  '/journal',
  '/pileated-watch',
  '/runs',
  '/flights',
  '/birding-dashboard',
  '/pixel-art',
] as const

type SlugDoc = { slug: string; _updatedAt?: string }

type SitemapHubDoc = {
  href?: string
  seo?: { noIndex?: boolean }
}

type SitemapHubsResult = {
  _updatedAt?: string
  hubs?: SitemapHubDoc[] | null
}

function resolveBaseUrl(siteUrl: string | null): string {
  try {
    return new URL(siteUrl || FALLBACK_BASE_URL).origin
  } catch {
    return FALLBACK_BASE_URL
  }
}

function normalizeSitePath(href: string | undefined): string | null {
  const path = href?.trim()
  if (!path || !path.startsWith('/') || path.startsWith('//')) return null
  return path
}

function buildHubEntries(
  baseUrl: string,
  hubData: SitemapHubsResult | null,
  lastModified: (value?: string) => Date,
): MetadataRoute.Sitemap {
  const updatedAt = hubData?._updatedAt
  const hubs = hubData?.hubs ?? []

  const seen = new Set<string>()
  const entries: MetadataRoute.Sitemap = []

  for (const hub of hubs) {
    const path = normalizeSitePath(hub?.href)
    if (!path || hub?.seo?.noIndex === true || seen.has(path)) continue
    seen.add(path)
    entries.push({
      url: `${baseUrl}${path}`,
      lastModified: lastModified(updatedAt),
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  }

  return entries
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [siteUrl, posts, pages, categories, authors, hubData] = await Promise.all([
    sanityClient.fetch<string | null>(SITE_URL_QUERY).catch(() => null),
    sanityClient.fetch<SlugDoc[]>(SITEMAP_POSTS_QUERY).catch(() => []),
    sanityClient.fetch<SlugDoc[]>(SITEMAP_PAGES_QUERY).catch(() => []),
    sanityClient.fetch<SlugDoc[]>(SITEMAP_CATEGORIES_QUERY).catch(() => []),
    sanityClient.fetch<SlugDoc[]>(SITEMAP_AUTHORS_QUERY).catch(() => []),
    sanityClient.fetch<SitemapHubsResult | null>(SITEMAP_HUBS_QUERY).catch(() => null),
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

  const hubEntries = buildHubEntries(baseUrl, hubData, lastModified)

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
    ...hubEntries,
    ...postEntries,
    ...pageEntries,
    ...categoryEntries,
    ...authorEntries,
  ]
}
