import type {Metadata} from 'next'
import {fetchEbirdBirdingConfig, getImageUrl} from '@/lib/sanity'
import type {EbirdBirding} from '@/lib/types'
import PortableText from '@/components/PortableText'
import BackyardBirdMapDynamic from '@/components/backyard/BackyardBirdMapDynamic'
import BackyardObservationsTable from '@/components/backyard/BackyardObservationsTable'
import {ebirdHasMapArea, fetchMapObservations} from '@/lib/ebird/client'
import {resolveEbirdBirding} from '@/lib/ebird/resolveConfig'
import {
  pageBanner,
  pageBodyTypography,
  pageContent,
  pageInner,
  pageKicker,
  pageSectionHeading,
  pageShellBg,
  pageTitleH1,
} from '@/lib/pageTypography'

export const revalidate = 300

function getConfig(): Promise<EbirdBirding | null> {
  return fetchEbirdBirdingConfig()
}

export async function generateMetadata(): Promise<Metadata> {
  const raw = await getConfig()
  const config = resolveEbirdBirding(raw)
  if (!config) {
    return {title: 'Pileated Watch'}
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

export default async function PileatedWatchPage() {
  const raw = await getConfig()
  const rawConfig = raw

  const missingCms =
    !rawConfig ||
    !rawConfig.mapPageTitle?.trim() ||
    !ebirdHasMapArea(rawConfig)

  if (missingCms) {
    return (
      <div className={pageShellBg}>
        <header className={pageBanner} role="banner" aria-labelledby="pileated-title">
          <div className={pageInner}>
            <h1 id="pileated-title" className={pageTitleH1}>
              Pileated Watch
            </h1>
            <div className={pageBodyTypography}>
              <p className="mb-6 text-inherit">
                Open <strong className="font-semibold text-gray-900">Sanity Studio</strong> →{' '}
                <strong className="font-semibold text-gray-900">
                  Pileated Watch (eBird)
                </strong>{' '}
                and fill in <strong className="font-semibold text-gray-900">Page title</strong>,
                your geographic area (hotspot L-codes or region code), and{' '}
                <strong className="font-semibold text-gray-900">Publish</strong>. Draft content
                does not appear on the live site.
              </p>
              <p className="mb-6 text-inherit">
                The server needs{' '}
                <code className="bg-gray-100 text-gray-900 px-2 py-1 rounded text-sm font-mono">
                  EBIRD_API_KEY
                </code>{' '}
                in{' '}
                <code className="bg-gray-100 text-gray-900 px-2 py-1 rounded text-sm font-mono">
                  .env.local
                </code>{' '}
                and on your host (e.g. Vercel).
              </p>
            </div>
          </div>
        </header>
      </div>
    )
  }

  const config = resolveEbirdBirding(raw)!
  const obsResult = await fetchMapObservations(config, revalidate)

  return (
    <div className={pageShellBg}>
      <a
        href="#pileated-watch-sightings"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-gray-900 text-white px-4 py-2 rounded-md text-sm"
      >
        Skip to sightings table
      </a>

      <header
        className={pageBanner}
        role="banner"
        aria-labelledby="pileated-title"
      >
        <div className={pageInner}>
          <p className={pageKicker}>
            Data from{' '}
            <a
              href="https://ebird.org/home"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              eBird
            </a>
          </p>
          <h1 id="pileated-title" className={pageTitleH1}>
            {config.mapPageTitle}
          </h1>
          {config.mapPageIntroduction?.length ? (
            <div className={pageBodyTypography}>
              <PortableText
                value={config.mapPageIntroduction}
                pageBodyTypography
              />
            </div>
          ) : null}
        </div>
      </header>

      <div className={pageContent} aria-labelledby="pileated-title">
        {!obsResult.ok ? (
          <p className="text-red-800 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-10 text-base">
            {obsResult.message}
          </p>
        ) : (
          <>
            <section className="mb-14" aria-labelledby="map-section-title">
              <h2 id="map-section-title" className={pageSectionHeading}>
                Map
              </h2>
              <BackyardBirdMapDynamic
                observations={obsResult.observations}
                defaultLatitude={config.defaultMapLatitude}
                defaultLongitude={config.defaultMapLongitude}
                defaultZoom={config.defaultMapZoom}
                focusSpeciesLabel={config.focusSpeciesCommonName}
              />
            </section>

            <BackyardObservationsTable
              observations={obsResult.observations}
              focusSpeciesLabel={config.focusSpeciesCommonName}
            />
          </>
        )}
      </div>
    </div>
  )
}
