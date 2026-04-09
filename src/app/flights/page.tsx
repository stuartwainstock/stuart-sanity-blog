import type {Metadata} from 'next'
import PageHeroWithDataSource from '@/components/PageHeroWithDataSource'
import PortableText from '@/components/PortableText'
import FlightsMapSection from './FlightsMapSection'
import {fetchToolProjectPageFlights, getImageUrl} from '@/lib/sanity'
import {
  pageBodyTypography,
  pageContent,
  pageDataSourceLink,
  pageShellBg,
} from '@/lib/pageTypography'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const pageCopy = await fetchToolProjectPageFlights()
  const seo = pageCopy?.seo
  const title = seo?.metaTitle || pageCopy?.pageTitle?.trim() || 'Flights'
  const description =
    seo?.metaDescription ||
    'Personal flight history from TripIt rendered as great-circle paths. Basemap © CARTO / OpenStreetMap.'

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
    robots: seo?.noIndex ? 'noindex, nofollow' : 'index, follow',
  }
}

export default async function FlightsPage() {
  const pageCopy = await fetchToolProjectPageFlights()

  const pageTitle = pageCopy?.pageTitle?.trim() || 'Flights'
  const mapSectionTitle = pageCopy?.mapSectionTitle?.trim() || 'Map'

  const heroIntroduction =
    pageCopy?.heroIntroduction && pageCopy.heroIntroduction.length > 0 ? (
      <div className={pageBodyTypography}>
        <PortableText value={pageCopy.heroIntroduction} pageBodyTypography />
      </div>
    ) : null

  return (
    <div className={pageShellBg}>
      <PageHeroWithDataSource
        titleId="flights-title"
        title={pageTitle}
        dataSource={
          <>
            <p>
              Flight data provided by{' '}
              <a
                href="https://www.tripit.com/"
                target="_blank"
                rel="noopener noreferrer"
                className={pageDataSourceLink}
              >
                TripIt
              </a>
              . Basemap ©{' '}
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
              contributors.
            </p>
          </>
        }
      >
        {heroIntroduction}
      </PageHeroWithDataSource>

      <div className={pageContent} aria-labelledby="flights-title">
        <FlightsMapSection
          mapSectionTitle={mapSectionTitle}
          mapSectionIntroduction={pageCopy?.mapSectionIntroduction ?? null}
        />
      </div>
    </div>
  )
}

