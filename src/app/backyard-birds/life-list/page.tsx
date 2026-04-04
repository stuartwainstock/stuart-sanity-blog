import Link from 'next/link'
import type {Metadata} from 'next'
import {sanityClient} from '@/lib/sanity'
import {getImageUrl} from '@/lib/sanity'
import {EBIRD_BIRDING_QUERY} from '@/lib/queries'
import type {EbirdBirding} from '@/lib/types'
import PortableText from '@/components/PortableText'
import LifeListTable from '@/components/backyard/LifeListTable'
import {fetchLifeListSpecies} from '@/lib/ebird/client'
import {resolveEbirdBirding} from '@/lib/ebird/resolveConfig'

export const revalidate = 300

async function getConfig(): Promise<EbirdBirding | null> {
  try {
    return await sanityClient.fetch<EbirdBirding | null>(EBIRD_BIRDING_QUERY)
  } catch (e) {
    console.error('eBird birding config fetch failed:', e)
    return null
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const raw = await getConfig()
  const config = resolveEbirdBirding(raw)
  if (!config) {
    return {title: 'Life list'}
  }
  const seo = config.seoLifeList
  const title = seo?.metaTitle || config.lifeListPageTitle
  const description = seo?.metaDescription
  return {
    title,
    description,
    keywords: seo?.keywords,
    openGraph: {
      title,
      description,
      images: seo?.openGraphImage?.asset
        ? [getImageUrl(seo.openGraphImage, 1200, 630)]
        : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: seo?.openGraphImage?.asset
        ? [getImageUrl(seo.openGraphImage, 1200, 630)]
        : [],
    },
    robots: seo?.noIndex ? 'noindex, nofollow' : 'index, follow',
  }
}

export default async function BirdingLifeListPage() {
  const raw = await getConfig()
  const rawConfig = raw
  const missingCms =
    !rawConfig ||
    !rawConfig.lifeListPageTitle?.trim() ||
    !rawConfig.lifeListLocationId?.trim()

  if (missingCms) {
    return (
      <div className="bg-[#e8e8e8] min-h-[50vh] px-6 py-16">
        <div className="max-w-2xl mx-auto prose prose-gray">
          <h1 className="text-2xl font-semibold text-gray-900">Life list</h1>
          <p className="text-gray-700">
            In <strong>Studio</strong> → <strong>Birding (eBird)</strong>, set{' '}
            <strong>Life list page title</strong> and{' '}
            <strong>Life list: region or hotspot ID</strong>, then{' '}
            <strong>Publish</strong>. Unpublished drafts are not visible on the
            public site.
          </p>
          <p>
            <Link href="/backyard-birds" className="text-emerald-900 underline">
              Back to map
            </Link>
          </p>
        </div>
      </div>
    )
  }

  const config = resolveEbirdBirding(raw)!
  const result = await fetchLifeListSpecies(config, revalidate)

  return (
    <div className="bg-[#e8e8e8]">
      <div className="max-w-5xl mx-auto px-6 py-12 sm:py-16">
        <header className="mb-10">
          <p className="text-sm text-gray-600 mb-2">
            <Link
              href="/backyard-birds"
              className="text-emerald-900 underline underline-offset-2 hover:text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 rounded-sm"
            >
              Map
            </Link>
            <span aria-hidden="true"> · </span>
            Data from{' '}
            <a
              href="https://ebird.org/home"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-900 underline underline-offset-2 hover:text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 rounded-sm"
            >
              eBird
            </a>
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-6">
            {config.lifeListPageTitle}
          </h1>
          {config.lifeListIntroduction?.length ? (
            <div className="prose prose-gray max-w-3xl text-gray-700 mb-8">
              <PortableText value={config.lifeListIntroduction} />
            </div>
          ) : null}
        </header>

        {!result.ok ? (
          <p className="text-red-800 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {result.message}
          </p>
        ) : (
          <LifeListTable species={result.species} />
        )}
      </div>
    </div>
  )
}
