'use server'

import {createClient} from '@sanity/client'
import {resolveEbirdBirding} from '@/lib/ebird/resolveConfig'
import {fetchAllSpeciesObservations} from '@/lib/ebird/client'
import {sanityClient} from '@/lib/sanity'
import {EBIRD_BIRDING_QUERY} from '@/lib/queries'
import type {EbirdBirding} from '@/lib/types'

// ── Sanity write client ───────────────────────────────────────────────────────
// Uses SANITY_API_WRITE_TOKEN (Editor permission) — server-only, never exposed
// to the browser. This is NOT the Sanity MCP (a dev tool); it is the standard
// @sanity/client write path used by production Server Actions.

function getWriteClient() {
  const token = process.env.SANITY_API_WRITE_TOKEN
  if (!token) throw new Error('SANITY_API_WRITE_TOKEN is not set.')

  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
    apiVersion: '2023-05-03',
    token,
    useCdn: false,
  })
}

// ── ID sanitisation ───────────────────────────────────────────────────────────
// Sanity _ids cannot contain colons or forward-slashes.
// BirdObservation.id is `${subId}:${speciesCode}:${obsDt}` — sanitise it.

function toSanityId(observationId: string): string {
  return `birdSighting-${observationId.replace(/[^a-zA-Z0-9_-]/g, '-')}`
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
 *  1. Fetch the ebirdBirding config singleton from Sanity.
 *  2. Resolve it into a typed config (hotspots / region, species code, etc.).
 *  3. Call fetchMapObservations() — the production eBird fetch entry point.
 *  4. Upsert each observation as a birdSighting document.
 *     - _id is deterministic so re-running is idempotent.
 *     - Accessibility fields (altText, plumageColors, callAudioUrl) are NOT
 *       overwritten on existing docs — editors enrich those in Sanity Studio.
 */
export async function syncSightingsAction(): Promise<SyncSightingsResult> {
  try {
    // 1. Load eBird config from Sanity
    const rawConfig = await sanityClient.fetch<EbirdBirding | null>(
      EBIRD_BIRDING_QUERY,
      {},
      {useCdn: false},
    )

    if (!rawConfig) {
      return {ok: false, created: 0, skipped: 0, message: 'No eBird config found in Sanity. Configure it in Studio → Pileated Watch (eBird).'}
    }

    // 2. Resolve config
    const config = resolveEbirdBirding(rawConfig)
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
    const client = getWriteClient()

    // Check which _ids already exist so we don't overwrite accessibility fields
    const incomingIds = observations.map((o) => toSanityId(o.id))
    const existing = await client.fetch<{_id: string}[]>(
      `*[_type == "birdSighting" && _id in $ids]{_id}`,
      {ids: incomingIds}
    )
    const existingIdSet = new Set(existing.map((d) => d._id))

    let created = 0
    let skipped = 0

    const transaction = client.transaction()

    for (const obs of observations) {
      const docId = toSanityId(obs.id)

      if (existingIdSet.has(docId)) {
        // Document exists — only update non-accessibility fields to preserve
        // any alt text, plumage colors, or audio URLs the editor has added.
        transaction.patch(docId, {
          set: {
            observedOn: obs.observedOn ?? null,
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
          observedOn: obs.observedOn ?? null,
          locationLabel: obs.locationLabel ?? null,
          latitude: obs.latitude,
          longitude: obs.longitude,
          ebirdChecklistUri: obs.checklistUri ?? null,
          // Accessibility fields — left for Studio editorial workflow:
          altText: '',
          plumageColors: [],
          callAudioUrl: null,
        })
        created++
      }
    }

    await transaction.commit()

    return {ok: true, created, skipped}
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return {ok: false, created: 0, skipped: 0, message}
  }
}
