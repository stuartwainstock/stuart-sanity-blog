'use server'

import {resolveEbirdDashboard} from '@/lib/ebird/resolveConfig'
import {
  fetchAllSpeciesObservations,
  observedOnToSanityDate,
} from '@/lib/ebird/client'
import {sanityClient} from '@/lib/sanity'
import {getSanityWriteClient} from '@/lib/sanity.server'
import {EBIRD_DASHBOARD_QUERY} from '@/lib/queries'
import type {EbirdDashboard} from '@/lib/types'

type UnsplashSuggestion = {
  suggestedCoverProvider: 'unsplash'
  suggestedCoverImageUrl: string
  suggestedCoverImagePageUrl: string | null
  suggestedCoverPhotographerName: string | null
  suggestedCoverPhotographerPageUrl: string | null
  suggestedCoverAltDraft: string | null
  suggestedCoverSearchQueryLast: string
  suggestedCoverSearchPage: number
  imageSuggestionStatus: 'pending_review'
}

// ── ID sanitisation ───────────────────────────────────────────────────────────
// Sanity _ids cannot contain colons or forward-slashes.
// BirdObservation.id is `${subId}:${speciesCode}:${obsDt}` — sanitise it.

function toSanityId(observationId: string): string {
  return `birdSighting-${observationId.replace(/[^a-zA-Z0-9_-]/g, '-')}`
}

function buildUnsplashSearchQuery(
  speciesName: string,
  speciesCode: string,
  locationLabel: string | null
): string {
  const name = (speciesName || '').trim() || 'bird'
  const code = (speciesCode || '').trim()
  const loc = (locationLabel || '').trim()
  const parts = [name, code, 'wild bird North America']
  if (loc) parts.push(loc)
  return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}

function buildAltDraft(
  speciesName: string,
  locationLabel: string | null,
  altDescription: string | null
): string {
  const name = speciesName?.trim() || 'Bird'
  const loc = locationLabel?.trim()
  const locPhrase = loc ? ` Location: ${loc}.` : ''
  if (altDescription) {
    const base = `${name}: ${altDescription}.${locPhrase} Verify this photo matches the species before publishing.`
    return base.replace(/\s+/g, ' ').trim().slice(0, 400)
  }
  return `Photograph of a ${name}.${locPhrase} Verify the image matches this eBird species before publishing.`
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 400)
}

async function suggestUnsplashForBirdSighting(args: {
  speciesName: string
  speciesCode: string
  locationLabel: string | null
  page?: number
}): Promise<UnsplashSuggestion | null> {
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY?.trim()
  if (!unsplashKey) return null

  const query = buildUnsplashSearchQuery(
    args.speciesName,
    args.speciesCode,
    args.locationLabel
  )
  const apiPage = Math.max(1, Math.min(10, args.page ?? 1))
  const u = new URL('https://api.unsplash.com/search/photos')
  u.searchParams.set('query', query)
  u.searchParams.set('per_page', '1')
  u.searchParams.set('orientation', 'landscape')
  u.searchParams.set('page', String(apiPage))

  const res = await fetch(u.toString(), {
    headers: {
      Authorization: `Client-ID ${unsplashKey}`,
      'Accept-Version': 'v1',
    },
  })

  if (!res.ok) return null
  const json: unknown = await res.json().catch(() => null)
  const hit =
    typeof json === 'object' &&
    json != null &&
    'results' in json &&
    Array.isArray((json as {results?: unknown}).results)
      ? (json as {results: unknown[]}).results[0]
      : null
  if (!hit) return null

  const hitRecord = hit as Record<string, unknown>
  const urls = (hitRecord.urls as Record<string, unknown> | undefined) ?? {}
  const user = (hitRecord.user as Record<string, unknown> | undefined) ?? {}
  const links = (hitRecord.links as Record<string, unknown> | undefined) ?? {}
  const userLinks = (user.links as Record<string, unknown> | undefined) ?? {}
  const imageUrl =
    (typeof urls.regular === 'string' && urls.regular) ||
    (typeof urls.small === 'string' && urls.small) ||
    null
  if (!imageUrl) return null

  const altDescription =
    (typeof hitRecord.alt_description === 'string' && hitRecord.alt_description.trim()) ||
    (typeof hitRecord.description === 'string' && hitRecord.description.trim()) ||
    null

  return {
    suggestedCoverProvider: 'unsplash',
    suggestedCoverImageUrl: imageUrl,
    suggestedCoverImagePageUrl: typeof links.html === 'string' ? links.html : null,
    suggestedCoverPhotographerName: typeof user.name === 'string' ? user.name : null,
    suggestedCoverPhotographerPageUrl: typeof userLinks.html === 'string' ? userLinks.html : null,
    suggestedCoverAltDraft: buildAltDraft(args.speciesName, args.locationLabel, altDescription),
    suggestedCoverSearchQueryLast: query,
    suggestedCoverSearchPage: apiPage,
    imageSuggestionStatus: 'pending_review',
  }
}

// ── Sync result ───────────────────────────────────────────────────────────────

export interface SyncSightingsResult {
  ok: boolean
  created: number
  skipped: number
  message?: string
}

/**
 * Server Action — syncs recent eBird observations into Sanity `birdSighting`
 * documents. Designed to be called from a <form action={syncSightingsAction}>
 * on the /birding-dashboard page.
 *
 * Flow:
 *  1. Fetch the `ebirdDashboard` sync-scope singleton from Sanity.
 *  2. Resolve it into a typed config (hotspots / region, days back, max rows).
 *  3. Call `fetchAllSpeciesObservations()` (all-species recent endpoint).
 *  4. Upsert each observation as a birdSighting document.
 *     - _id is deterministic so re-running is idempotent.
 *     - Accessibility fields (altText, plumageColors, callAudioUrl) are NOT
 *       overwritten on existing docs — editors enrich those in Sanity Studio.
 */
export async function syncSightingsAction(): Promise<SyncSightingsResult> {
  try {
    // 1. Load dashboard sync scope config from Sanity
    const rawConfig = await sanityClient.fetch<EbirdDashboard | null>(
      EBIRD_DASHBOARD_QUERY,
      {},
      {useCdn: false},
    )

    if (!rawConfig) {
      return {
        ok: false,
        created: 0,
        skipped: 0,
        message:
          'No Birding Dashboard eBird config found in Sanity. Configure it in Studio → Birding Dashboard sync scope (eBird).',
      }
    }

    // 2. Resolve config
    const config = resolveEbirdDashboard(rawConfig)
    if (!config) {
      return {ok: false, created: 0, skipped: 0, message: 'eBird config could not be resolved.'}
    }

    // 3. Fetch all-species observations from eBird API
    // (Dashboard covers the full region, not just the focus species on Pileated Watch)
    const result = await fetchAllSpeciesObservations(config)

    if (!result.ok) {
      return {ok: false, created: 0, skipped: 0, message: result.message}
    }

    const {observations} = result
    if (observations.length === 0) {
      return {ok: true, created: 0, skipped: 0, message: 'No observations returned from eBird.'}
    }

    // 4. Upsert into Sanity
    const client = getSanityWriteClient()

    // Check which _ids already exist so we don't overwrite accessibility fields
    const incomingIds = observations.map((o) => toSanityId(o.id))
    const existing = await client.fetch<{_id: string}[]>(
      `*[_type == "birdSighting" && _id in $ids]{_id}`,
      {ids: incomingIds}
    )
    const existingIdSet = new Set(existing.map((d) => d._id))

    let created = 0
    let skipped = 0
    const createdIds: string[] = []

    const transaction = client.transaction()

    for (const obs of observations) {
      const docId = toSanityId(obs.id)
      const observedOnSanity =
        observedOnToSanityDate(obs.observedOn) ??
        observedOnToSanityDate(
          obs.id.includes(':') ? obs.id.split(':').pop() ?? null : null,
        )

      if (existingIdSet.has(docId)) {
        // Document exists — only update non-accessibility fields to preserve
        // any alt text, plumage colors, or audio URLs the editor has added.
        transaction.patch(docId, {
          set: {
            observedOn: observedOnSanity,
            locationLabel: obs.locationLabel ?? null,
            latitude: obs.latitude,
            longitude: obs.longitude,
            ebirdChecklistUri: obs.checklistUri ?? null,
          },
        })
        skipped++
      } else {
        // New document — create with full eBird data; accessibility fields left
        // blank for editors to enrich in Sanity Studio.
        transaction.createIfNotExists({
          _id: docId,
          _type: 'birdSighting',
          speciesName: obs.speciesName,
          speciesCode: obs.speciesCode,
          observedOn: observedOnSanity,
          locationLabel: obs.locationLabel ?? null,
          latitude: obs.latitude,
          longitude: obs.longitude,
          ebirdChecklistUri: obs.checklistUri ?? null,
          // Accessibility fields — left for Studio editorial workflow:
          altText: '',
          plumageColors: [],
          callAudioUrl: null,
          imageSuggestionStatus: 'none',
          suggestedCoverProvider: 'none',
        })
        created++
        createdIds.push(docId)
      }
    }

    await transaction.commit()

    // 5. Smooth editorial workflow: generate Unsplash suggestion for newly created docs
    // (best-effort; missing UNSPLASH_ACCESS_KEY is fine).
    if (createdIds.length > 0) {
      const createdDocs = await client.fetch<
        {
          _id: string
          speciesName: string
          speciesCode: string
          locationLabel: string | null
          cardImage?: unknown
          imageSuggestionStatus?: string
          suggestedCoverImageUrl?: string
        }[]
      >(
        `*[_type == "birdSighting" && _id in $ids]{
          _id,
          speciesName,
          speciesCode,
          locationLabel,
          cardImage,
          imageSuggestionStatus,
          suggestedCoverImageUrl
        }`,
        {ids: createdIds}
      )

      // Keep this bounded so the sync button stays snappy.
      const maxToSuggest = Math.min(10, createdDocs.length)
      for (const doc of createdDocs.slice(0, maxToSuggest)) {
        if (doc.cardImage) continue
        if (doc.imageSuggestionStatus === 'dismissed') continue
        if (typeof doc.suggestedCoverImageUrl === 'string' && doc.suggestedCoverImageUrl.trim()) continue

        const suggestion = await suggestUnsplashForBirdSighting({
          speciesName: doc.speciesName,
          speciesCode: doc.speciesCode,
          locationLabel: doc.locationLabel ?? null,
          page: 1,
        })
        if (!suggestion) continue

        await client.patch(doc._id).set(suggestion).commit()
      }
    }

    return {ok: true, created, skipped}
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return {ok: false, created: 0, skipped: 0, message}
  }
}
