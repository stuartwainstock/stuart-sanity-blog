import type {Metadata} from 'next'
import FlightPathMapDynamic from '@/components/travel/FlightPathMapDynamic'
import PageHeroWithDataSource from '@/components/PageHeroWithDataSource'
import PortableText from '@/components/PortableText'
import airports from '@/data/mock/airports.json'
import flights from '@/data/mock/flights.json'
import {fetchToolProjectPageFlightsDemo, getImageUrl} from '@/lib/sanity'
import {
  pageBodyTypography,
  pageContent,
  pageDataSourceLink,
  pageSectionHeading,
  pageShellBg,
} from '@/lib/pageTypography'
import type {AirportCoords, FlightLeg} from '@/lib/travel/types'

export async function generateMetadata(): Promise<Metadata> {
  const pageCopy = await fetchToolProjectPageFlightsDemo()
  const seo = pageCopy?.seo
  const title = seo?.metaTitle || pageCopy?.pageTitle?.trim() || 'Flight paths (demo)'
  const description =
    seo?.metaDescription ||
    'Great-circle flight map with mock TripIt-style data. Basemap © CARTO / OpenStreetMap.'
  const noIndex = seo?.noIndex !== false

  return {
    title,
    description,
    keywords: seo?.keywords,
    openGraph: {
      title,
      description,
      images: seo?.openGraphImage?.asset ? [getImageUrl(seo.openGraphImage, 1200, 630)] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: seo?.openGraphImage?.asset ? [getImageUrl(seo.openGraphImage, 1200, 630)] : [],
    },
    robots: noIndex ? 'noindex, nofollow' : 'index, follow',
  }
}

export default async function TravelFlightsDemoPage() {
  const pageCopy = await fetchToolProjectPageFlightsDemo()

  const legs = flights as FlightLeg[]
  const coords = airports as AirportCoords

  const pageTitle = pageCopy?.pageTitle?.trim() || 'Flight paths (demo)'
  const mapSectionTitle = pageCopy?.mapSectionTitle?.trim()

  const heroExtras =
    pageCopy?.heroIntroduction && pageCopy.heroIntroduction.length > 0 ? (
      <div className={`${pageBodyTypography} mt-8`}>
        <PortableText value={pageCopy.heroIntroduction} pageBodyTypography />
      </div>
    ) : null

  const mapIntro =
    pageCopy?.mapSectionIntroduction && pageCopy.mapSectionIntroduction.length > 0 ? (
      <div className={pageBodyTypography}>
        <PortableText value={pageCopy.mapSectionIntroduction} pageBodyTypography />
      </div>
    ) : (
      <div className={pageBodyTypography}>
        <p className="mb-0 text-inherit max-w-4xl">
          Mock data from{' '}
          <code className="text-sm bg-gray-100 px-1 rounded">src/data/mock/flights.json</code> with airport
          coordinates in{' '}
          <code className="text-sm bg-gray-100 px-1 rounded">src/data/mock/airports.json</code>. Hover a
          route to see date and distance. Replace with TripIt (or another feed) when ready.
        </p>
      </div>
    )

  return (
    <div className={pageShellBg}>
      <PageHeroWithDataSource
        titleId="flights-demo-title"
        title={pageTitle}
        dataSource={
          <>
            <p>
              Basemap ©{' '}
              <a
                href="https://carto.com/"
                target="_blank"
                rel="noopener noreferrer"
                className={pageDataSourceLink}
              >
                CARTO
              </a>
              , ©{' '}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
                className={pageDataSourceLink}
              >
                OpenStreetMap
              </a>{' '}
              contributors. Flight segments are great-circle approximations for visualization.
            </p>
          </>
        }
      >
        {heroExtras}
      </PageHeroWithDataSource>

      <div className={pageContent} aria-labelledby="flights-demo-title">
        {mapSectionTitle ? <h2 className={pageSectionHeading}>{mapSectionTitle}</h2> : null}
        <div className={mapSectionTitle ? 'mt-4 space-y-6' : 'space-y-6'}>
          {mapIntro}
          <FlightPathMapDynamic flights={legs} airports={coords} />
        </div>
      </div>
    </div>
  )
}
