import Link from 'next/link'
import type {Metadata} from 'next'
import {Suspense} from 'react'
import PortableText from '@/components/molecules/PortableText'
import {createServerSupabase} from '@/lib/supabase/server'
import PageHeroWithDataSource from '@/components/molecules/PageHeroWithDataSource'
import {RunsMapSectionSkeleton, RunsTableSectionSkeleton} from '@/components/strava/RunsMapTableSkeleton'
import {fetchToolProjectPageRuns, getImageUrl} from '@/lib/sanity'
import {
  pageBodyTypography,
  pageContent,
  pageDataSourceLink,
  pageShellBg,
} from '@/lib/pageTypography'
import {RUNS_MAP_WINDOW_DAYS} from '@/lib/strava/constants'
import RunsMapSection from './RunsMapSection'
import RunsTableSection from './RunsTableSection'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const pageCopy = await fetchToolProjectPageRuns()
  const seo = pageCopy?.seo
  const title = seo?.metaTitle || pageCopy?.pageTitle?.trim() || 'Runs'
  const description = seo?.metaDescription || 'Personal Strava runs synced to this site.'
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

export default async function RunsPage() {
  const supabase = createServerSupabase()

  const [pageCopy, oauthRes, countRes] = await Promise.all([
    fetchToolProjectPageRuns(),
    supabase.from('strava_oauth').select('athlete_id').eq('id', 'singleton').maybeSingle(),
    supabase.from('strava_activities').select('*', {count: 'exact', head: true}),
  ])

  const connected = Boolean(oauthRes.data)
  const runCount = countRes.count ?? 0

  const pageTitle = pageCopy?.pageTitle?.trim() || 'Runs'
  const mapSectionTitle = pageCopy?.mapSectionTitle?.trim() || 'Map'
  const tableSectionTitle = pageCopy?.tableSectionTitle?.trim() || 'Recent runs'

  const heroIntroduction =
    pageCopy?.heroIntroduction && pageCopy.heroIntroduction.length > 0 ? (
      <div className={pageBodyTypography}>
        <PortableText value={pageCopy.heroIntroduction} pageBodyTypography />
      </div>
    ) : (
      <div className={pageBodyTypography}>
        <p className="mb-6 text-inherit">
          Personal Strava runs stored in Supabase. The map and table show the last {RUNS_MAP_WINDOW_DAYS}{' '}
          days. Site owners sync data from the{' '}
          <Link
            href="/admin/strava"
            className="font-medium text-orange-800 underline underline-offset-2 hover:text-orange-900"
          >
            Strava admin page
          </Link>{' '}
          (password-protected).
        </p>
      </div>
    )

  return (
    <div className={pageShellBg}>
      <a
        href="#runs-map"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-gray-900 text-white px-4 py-2 rounded-md text-sm"
      >
        Skip to map
      </a>
      <a
        href="#runs-recent"
        className="sr-only focus:not-sr-only focus:top-16 focus:left-4 focus:z-50 bg-gray-900 text-white px-4 py-2 rounded-md text-sm"
      >
        Skip to recent runs
      </a>

      <PageHeroWithDataSource
        titleId="runs-title"
        title={pageTitle}
        dataSource={
          <>
            <p>
              Activity data provided by{' '}
              <a
                href="https://www.strava.com"
                target="_blank"
                rel="noopener noreferrer"
                className={pageDataSourceLink}
              >
                Strava
              </a>
              .
            </p>
            <p>
              Place names inferred from coordinates use{' '}
              <a
                href="https://nominatim.openstreetmap.org/"
                target="_blank"
                rel="noopener noreferrer"
                className={pageDataSourceLink}
              >
                OpenStreetMap Nominatim
              </a>{' '}
              (© OpenStreetMap contributors,{' '}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
                className={pageDataSourceLink}
              >
                ODbL
              </a>
              ).
            </p>
          </>
        }
      >
        {heroIntroduction}
      </PageHeroWithDataSource>

      <div className={pageContent} aria-labelledby="runs-title">
        {connected && runCount === 0 ? (
          <p className="mb-10 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950 text-base">
            No runs in the database yet. If you manage this site, open the{' '}
            <Link
              href="/admin/strava"
              className="font-medium text-orange-900 underline underline-offset-2 hover:text-orange-950"
            >
              Strava admin page
            </Link>{' '}
            to connect and sync.
          </p>
        ) : null}

        {connected && runCount > 0 ? (
          <>
            <Suspense fallback={<RunsMapSectionSkeleton />}>
              <RunsMapSection
                mapSectionTitle={mapSectionTitle}
                mapSectionIntroduction={pageCopy?.mapSectionIntroduction}
              />
            </Suspense>
            <Suspense fallback={<RunsTableSectionSkeleton />}>
              <RunsTableSection
                tableSectionTitle={tableSectionTitle}
                tableSectionIntroduction={pageCopy?.tableSectionIntroduction}
              />
            </Suspense>
          </>
        ) : null}
      </div>
    </div>
  )
}
