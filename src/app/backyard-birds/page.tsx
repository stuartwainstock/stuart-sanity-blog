import Link from 'next/link'
import type {Metadata} from 'next'
import {sanityClient} from '@/lib/sanity'
import {getImageUrl} from '@/lib/sanity'
import {INATURALIST_BACKYARD_QUERY} from '@/lib/queries'
import type {InaturalistBackyard} from '@/lib/types'
import PortableText from '@/components/PortableText'
import BackyardBirdMap from '@/components/backyard/BackyardBirdMap'
import BackyardObservationsTable from '@/components/backyard/BackyardObservationsTable'
import {fetchBackyardObservations} from '@/lib/inaturalist/client'
import {resolveInaturalistBackyard} from '@/lib/inaturalist/resolveConfig'

export const revalidate = 300

async function getConfig(): Promise<InaturalistBackyard | null> {
  try {
    return await sanityClient.fetch<InaturalistBackyard | null>(
      INATURALIST_BACKYARD_QUERY
    )
  } catch (e) {
    console.error('Backyard birds config fetch failed:', e)
    return null
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const raw = await getConfig()
  const config = resolveInaturalistBackyard(raw)
  if (!config) {
    return {title: 'Backyard birds'}
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

export default async function BackyardBirdsMapPage() {
  const raw = await getConfig()
  const config = resolveInaturalistBackyard(raw)

  if (!config?.inatUserLogin) {
    return (
      <div className="bg-[#e8e8e8] min-h-[50vh] px-6 py-16">
        <div className="max-w-2xl mx-auto prose prose-gray">
          <h1 className="text-2xl font-semibold text-gray-900">
            Backyard birds
          </h1>
          <p className="text-gray-700">
            Create the singleton document{' '}
            <strong>Backyard birds (iNaturalist)</strong> in Sanity Studio and
            fill in at least your <strong>iNaturalist username</strong> and page
            titles. This page will then load your public observations from the
            iNaturalist API.
          </p>
        </div>
      </div>
    )
  }

  const inat = await fetchBackyardObservations(config, revalidate)

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
            Powered by{' '}
            <a
              href="https://www.inaturalist.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-900 underline underline-offset-2 hover:text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 rounded-sm"
            >
              iNaturalist
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

        {!inat.ok ? (
          <p className="text-red-800 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-10">
            {inat.message}
          </p>
        ) : (
          <>
            <section
              className="mb-14"
              aria-labelledby="map-section-title"
            >
              <h2
                id="map-section-title"
                className="text-xl font-semibold text-gray-900 mb-4"
              >
                Map
              </h2>
              <BackyardBirdMap
                observations={inat.observations}
                defaultLatitude={config.defaultMapLatitude}
                defaultLongitude={config.defaultMapLongitude}
                defaultZoom={config.defaultMapZoom}
              />
            </section>

            <BackyardObservationsTable observations={inat.observations} />
          </>
        )}
      </div>
    </div>
  )
}
