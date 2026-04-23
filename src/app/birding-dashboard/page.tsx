import type {Metadata} from 'next'
import {redirect} from 'next/navigation'
import Link from 'next/link'
import {sanityClient} from '@/lib/sanity'
import {BIRD_SIGHTINGS_QUERY} from '@/lib/queries'
import {syncSightingsAction} from '@/lib/ebird/syncSightings'
import type {BirdSighting} from '@/components/backyard/BirdCard'
import PageHeroWithDataSource from '@/components/molecules/PageHeroWithDataSource'
import {
  pageContent,
  pageDataSourceLink,
  pageShellBg,
} from '@/lib/pageTypography'
import {BirdingGrid} from './BirdingGrid'
import styles from './page.module.css'

// ── Metadata ──────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Birding Dashboard',
  description: 'Recent bird sightings synced from eBird, enriched with accessibility metadata in Sanity Studio.',
  robots: 'noindex, nofollow', // Admin-adjacent tool page
}

// ── Revalidation ──────────────────────────────────────────────────────────────
// Short revalidation so Studio accessibility enrichments (altText, plumageColors,
// callAudioUrl) appear on the page within a minute of being published.

export const revalidate = 60

// ── Server Action wrapper ─────────────────────────────────────────────────────
// Wraps syncSightingsAction to redirect back to this page with a status param
// so the result is visible after the POST/redirect cycle.

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
  }>
}

export default async function BirdingDashboardPage({searchParams}: BirdingDashboardPageProps) {
  const params = await searchParams

  const [sightings] = await Promise.all([
    sanityClient.fetch<BirdSighting[]>(
      BIRD_SIGHTINGS_QUERY,
      {},
      {useCdn: false, next: {revalidate}},
    ),
  ])

  // Sync result banner state (populated after POST→redirect)
  const synced = params.synced === '1'
  const created = Number(params.created ?? 0)
  const skipped = Number(params.skipped ?? 0)
  const syncError = params.sync_error
    ? decodeURIComponent(params.sync_error)
    : null

  return (
    <div className={pageShellBg}>
      {/* ── Skip navigation ── */}
      <a href="#sightings-heading" className="skip-link">
        Skip to sightings
      </a>

      {/* ── Page hero ── */}
      <PageHeroWithDataSource
        titleId="birding-dashboard-title"
        title="Birding Dashboard"
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
            . Accessibility metadata (alt text, plumage colors, call audio) enriched
            in{' '}
            <Link href="/studio" className={pageDataSourceLink}>
              Sanity Studio
            </Link>
            .
          </p>
        }
      >
        <p style={{fontSize: '1rem', color: 'var(--color-documented-prose-body)', lineHeight: 1.6, margin: 0}}>
          Manage and preview bird sighting cards. Sync pulls recent observations
          from the eBird config (Studio → Pileated Watch). Existing accessibility
          fields are never overwritten by a sync.
        </p>
      </PageHeroWithDataSource>

      {/* ── Main content ── */}
      <main id="birding-dashboard-main" className={pageContent} aria-labelledby="birding-dashboard-title">

        {/* ── Sync toolbar ── */}
        <div className={styles.syncBar} role="region" aria-label="eBird sync controls">
          <form action={syncAndRedirect}>
            <button type="submit" className={styles.syncButton}>
              {/* Binoculars-ish icon via SVG — no icon library dependency */}
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
            {sightings.length} sighting{sightings.length !== 1 ? 's' : ''} in Sanity
          </p>

          {/* Result banners — shown after POST→redirect */}
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
        <BirdingGrid sightings={sightings} />
      </main>
    </div>
  )
}
