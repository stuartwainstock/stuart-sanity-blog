import Link from 'next/link'
import type {Metadata} from 'next'
import {sanityClient} from '@/lib/sanity'
import {getImageUrl} from '@/lib/sanity'
import {EBIRD_BIRDING_QUERY} from '@/lib/queries'
import type {EbirdBirding} from '@/lib/types'
import PortableText from '@/components/PortableText'
import BackyardBirdMap from '@/components/backyard/BackyardBirdMap'
import BackyardObservationsTable from '@/components/backyard/BackyardObservationsTable'
import {fetchMapObservations} from '@/lib/ebird/client'
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
    return {title: 'Birding map'}
  }
  const seo = config.seoMap
  const title = seo?.metaTitle || config.mapPageTitle
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

export default async function BirdingMapPage() {
  const raw = await getConfig()
  const rawConfig = raw

  const missingCms =
    !rawConfig ||
    !rawConfig.mapPageTitle?.trim() ||
    !rawConfig.lifeListLocationId?.trim()

  if (missingCms) {
    return (
      <div className="bg-[#e8e8e8] min-h-[50vh] px-6 py-16">
        <div className="max-w-2xl mx-auto prose prose-gray">
          <h1 className="text-2xl font-semibold text-gray-900">Birding map</h1>
          <p className="text-gray-700">
            Open <strong>Sanity Studio</strong> → <strong>Birding (eBird)</strong>{' '}
            and fill in <strong>Map page title</strong> and{' '}
            <strong>Life list: region or hotspot ID</strong>, then{' '}
            <strong>Publish</strong>. Draft-only content does not appear on the live
            site (the API uses the published dataset).
          </p>
          <p className="text-gray-700">
            Also set map source (hotspots with L-codes, or region code) and other
            fields as needed. The server needs{' '}
            <code className="text-sm">EBIRD_API_KEY</code> only after this config is
            published—add it in Vercel and in <code className="text-sm">.env.local</code>{' '}
            for local dev.
          </p>
        </div>
      </div>
    )
  }

  const config = resolveEbirdBirding(raw)!
  const obsResult = await fetchMapObservations(config, revalidate)

  return (
    <div className="bg-[#e8e8e8]">
      <div className="max-w-5xl mx-auto px-6 py-12 sm:py-16">
        <a
          href="#backyard-observations-table"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-gray-900 text-white px-4 py-2 rounded-md text-sm"
        >
          Skip to observation list
        </a>

        <header className="mb-10">
          <p className="text-sm text-gray-600 mb-2">
            <Link
              href="/backyard-birds/life-list"
              className="text-emerald-900 underline underline-offset-2 hover:text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 rounded-sm"
            >
              Life list
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
            {config.mapPageTitle}
          </h1>
          {config.mapPageIntroduction?.length ? (
            <div className="prose prose-gray max-w-3xl text-gray-700">
              <PortableText value={config.mapPageIntroduction} />
            </div>
          ) : null}
        </header>

        {!obsResult.ok ? (
          <p className="text-red-800 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-10">
            {obsResult.message}
          </p>
        ) : (
          <>
            <section className="mb-14" aria-labelledby="map-section-title">
              <h2
                id="map-section-title"
                className="text-xl font-semibold text-gray-900 mb-4"
              >
                Map
              </h2>
              <BackyardBirdMap
                observations={obsResult.observations}
                defaultLatitude={config.defaultMapLatitude}
                defaultLongitude={config.defaultMapLongitude}
                defaultZoom={config.defaultMapZoom}
              />
            </section>

            <BackyardObservationsTable observations={obsResult.observations} />
          </>
        )}
      </div>
    </div>
  )
}
