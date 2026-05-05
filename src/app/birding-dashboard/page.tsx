import type {Metadata} from 'next'
import {redirect} from 'next/navigation'
import Link from 'next/link'
import {sanityClient, fetchToolProjectPageBirding, getImageUrl} from '@/lib/sanity'
import {BIRD_SIGHTINGS_COUNT_QUERY, BIRD_SIGHTINGS_PAGE_QUERY} from '@/lib/queries'
import {syncSightingsAction} from '@/lib/ebird/syncSightings'
import type {BirdSighting} from '@/components/backyard/BirdCard'
import type {SanityImage} from '@/lib/types'
import PortableText from '@/components/molecules/PortableText'
import PageHeroWithDataSource from '@/components/molecules/PageHeroWithDataSource'
import {
  pageBodyTypography,
  pageContent,
  pageDataSourceLink,
  pageShellBg,
} from '@/lib/pageTypography'
import {BirdingGrid} from './BirdingGrid'
import styles from './page.module.css'

// ── Revalidation ──────────────────────────────────────────────────────────────

export const revalidate = 60

const SIGHTINGS_PER_PAGE = 24

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const pageCopy = await fetchToolProjectPageBirding()
  const seo = pageCopy?.seo
  const title = seo?.metaTitle || pageCopy?.pageTitle?.trim() || 'Birding Dashboard'
  const description =
    seo?.metaDescription ||
    'Recent bird sightings synced from eBird, enriched with accessibility metadata in Sanity Studio.'
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
    robots: 'noindex, nofollow', // Admin-adjacent tool page
  }
}

// ── Server Action wrapper ─────────────────────────────────────────────────────
// Wraps syncSightingsAction to redirect back with a status param visible after
// the POST→redirect cycle.

async function syncAndRedirect() {
  'use server'
  const result = await syncSightingsAction()
  if (result.ok) {
    redirect(
      `/birding-dashboard?synced=1&created=${result.created}&skipped=${result.skipped}`
    )
  } else {
    const msg = encodeURIComponent(result.message ?? 'Sync failed.')
    redirect(`/birding-dashboard?sync_error=${msg}`)
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface BirdingDashboardPageProps {
  searchParams: Promise<{
    synced?: string
    created?: string
    skipped?: string
    sync_error?: string
    page?: string
  }>
}

type BirdSightingSanityRow = BirdSighting & {
  cardImage?: SanityImage | null
  cardImageAlt?: string | null
  suggestedCoverAltDraft?: string | null
  suggestedAudioRecordist?: string | null
  suggestedAudioSourceUrl?: string | null
}

export default async function BirdingDashboardPage({searchParams}: BirdingDashboardPageProps) {
  const params = await searchParams
  const pageCopy = await fetchToolProjectPageBirding()

  const requestedPage = Math.max(1, Number(params.page ?? 1) || 1)

  const totalSightings = await sanityClient.fetch<number>(
    BIRD_SIGHTINGS_COUNT_QUERY,
    {},
    {useCdn: false, next: {revalidate}},
  )
  const totalPages = Math.max(1, Math.ceil(totalSightings / SIGHTINGS_PER_PAGE))
  const currentPage = Math.min(requestedPage, totalPages)

  if (requestedPage !== currentPage) {
    const sp = new URLSearchParams()
    if (params.synced) sp.set('synced', params.synced)
    if (params.created) sp.set('created', params.created)
    if (params.skipped) sp.set('skipped', params.skipped)
    if (params.sync_error) sp.set('sync_error', params.sync_error)
    if (currentPage > 1) sp.set('page', String(currentPage))
    redirect(`/birding-dashboard?${sp.toString()}`)
  }

  const start = (currentPage - 1) * SIGHTINGS_PER_PAGE
  const end = start + SIGHTINGS_PER_PAGE
  const rawSightings = await sanityClient.fetch<BirdSightingSanityRow[]>(
    BIRD_SIGHTINGS_PAGE_QUERY,
    {start, end},
    {useCdn: false, next: {revalidate}},
  )

  const sightings: BirdSighting[] = rawSightings.map((s) => ({
    _id: s._id,
    speciesName: s.speciesName,
    speciesCode: s.speciesCode,
    observedOn: s.observedOn,
    locationLabel: s.locationLabel,
    altText: s.altText,
    plumageColors: s.plumageColors,
    callAudioUrl: s.callAudioUrl,
    ebirdChecklistUri: s.ebirdChecklistUri,
    latitude: s.latitude,
    longitude: s.longitude,
    cardImage: s.cardImage?.asset ? s.cardImage : null,
    cardImageAlt: s.cardImageAlt?.trim() || null,
    suggestedCoverImageUrl: s.suggestedCoverImageUrl?.trim() || null,
    suggestedCoverImagePageUrl: s.suggestedCoverImagePageUrl?.trim() || null,
    suggestedCoverPhotographerName: s.suggestedCoverPhotographerName?.trim() || null,
    suggestedCoverPhotographerPageUrl: s.suggestedCoverPhotographerPageUrl?.trim() || null,
    suggestedCoverAltDraft: s.suggestedCoverAltDraft?.trim() || null,
    suggestedCoverProvider: s.suggestedCoverProvider ?? null,
    imageSuggestionStatus: s.imageSuggestionStatus ?? null,
    suggestedAudioRecordist: s.suggestedAudioRecordist?.trim() || null,
    suggestedAudioSourceUrl: s.suggestedAudioSourceUrl?.trim() || null,
  }))

  const pageTitle = pageCopy?.pageTitle?.trim() || 'Birding Dashboard'
  const sightingsSectionTitle = pageCopy?.birdingSightingsTitle?.trim() || 'Recent sightings'

  // Sync result banner state (populated after POST→redirect)
  const synced = params.synced === '1'
  const created = Number(params.created ?? 0)
  const skipped = Number(params.skipped ?? 0)
  const syncError = params.sync_error
    ? decodeURIComponent(params.sync_error)
    : null

  const pagingParams = new URLSearchParams()
  if (params.synced) pagingParams.set('synced', params.synced)
  if (params.created) pagingParams.set('created', params.created)
  if (params.skipped) pagingParams.set('skipped', params.skipped)
  if (params.sync_error) pagingParams.set('sync_error', params.sync_error)
  const pageHref = (page: number) => {
    const sp = new URLSearchParams(pagingParams)
    if (page > 1) sp.set('page', String(page))
    else sp.delete('page')
    const qs = sp.toString()
    return qs ? `/birding-dashboard?${qs}` : '/birding-dashboard'
  }

  const heroIntro =
    pageCopy?.heroIntroduction && pageCopy.heroIntroduction.length > 0 ? (
      <div className={pageBodyTypography}>
        <PortableText value={pageCopy.heroIntroduction} pageBodyTypography />
      </div>
    ) : (
      <p style={{fontSize: '1rem', color: 'var(--color-documented-prose-body)', lineHeight: 1.6, margin: 0}}>
        Manage and preview bird sighting cards across all species in the region. Sync
        pulls recent observations from the eBird geographic area configured in{' '}
        <Link href="/studio" className={pageDataSourceLink}>
          Studio → Birding Dashboard sync scope
        </Link>
        . Existing accessibility fields (alt text, plumage, audio) are never
        overwritten on re-sync.
      </p>
    )

  return (
    <div className={pageShellBg}>
      {/* ── Skip navigation ── */}
      <a href="#sightings-heading" className="skip-link">
        Skip to sightings
      </a>

      {/* ── Page hero ── */}
      <PageHeroWithDataSource
        titleId="birding-dashboard-title"
        title={pageTitle}
        dataSource={
          <p>
            Sightings synced from{' '}
            <a
              href="https://ebird.org/home"
              target="_blank"
              rel="noopener noreferrer"
              className={pageDataSourceLink}
            >
              eBird
            </a>
            .             Accessibility metadata (alt text, optional card images, plumage colors, call audio) enriched
            in{' '}
            <Link href="/studio" className={pageDataSourceLink}>
              Sanity Studio
            </Link>
            .
          </p>
        }
      >
        {heroIntro}
      </PageHeroWithDataSource>

      {/* ── Main content ── */}
      <main id="birding-dashboard-main" className={pageContent} aria-labelledby="birding-dashboard-title">

        {/* ── Sync toolbar ── */}
        <div className={styles.syncBar} role="region" aria-label="eBird sync controls">
          <form action={syncAndRedirect}>
            <button type="submit" className={styles.syncButton}>
              <svg
                aria-hidden="true"
                focusable="false"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Sync from eBird
            </button>
          </form>

          <p className={styles.syncMeta}>
            {totalSightings} sighting{totalSightings !== 1 ? 's' : ''} in Sanity
          </p>

          {synced && (
            <p className={styles.syncSuccess} role="status" aria-live="polite">
              ✓ Sync complete — {created} new, {skipped} already existed.
            </p>
          )}
          {syncError && (
            <p className={styles.syncError} role="alert">
              ✗ {syncError}
            </p>
          )}
        </div>

        {/* ── Card grid (client component owns highContrast toggle) ── */}
        <BirdingGrid
          sightings={sightings}
          sectionTitle={sightingsSectionTitle}
          sectionIntroduction={pageCopy?.birdingSightingsIntroduction}
          pagination={{
            currentPage,
            totalPages,
            totalCount: totalSightings,
            pageSize: SIGHTINGS_PER_PAGE,
            prevHref: currentPage > 1 ? pageHref(currentPage - 1) : null,
            nextHref: currentPage < totalPages ? pageHref(currentPage + 1) : null,
          }}
        />
      </main>
    </div>
  )
}
