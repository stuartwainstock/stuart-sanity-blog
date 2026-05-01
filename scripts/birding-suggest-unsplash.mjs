#!/usr/bin/env node
/**
 * Populate Unsplash *suggestions* on `birdSighting` docs for Studio review.
 * Editors still approve by adding Card image (Unsplash asset source) + Card image alt text in Studio.
 *
 * Requires:
 *   NEXT_PUBLIC_SANITY_PROJECT_ID
 *   NEXT_PUBLIC_SANITY_DATASET
 *   SANITY_API_WRITE_TOKEN (or SANITY_API_TOKEN)
 *   UNSPLASH_ACCESS_KEY — Unsplash API "Access Key" (public, still server-only here)
 *
 * Usage:
 *   node --env-file=.env.local scripts/birding-suggest-unsplash.mjs
 *   DRY_RUN=1 node --env-file=.env.local scripts/birding-suggest-unsplash.mjs
 *   MAX=25 node --env-file=.env.local scripts/birding-suggest-unsplash.mjs
 *
 * Regenerate (next Unsplash search page) for docs already in `pending_review`:
 *   REGENERATE=1 node --env-file=.env.local scripts/birding-suggest-unsplash.mjs
 *
 * Optional per-doc override in Studio: `suggestedCoverSearchQueryManual` — exact Unsplash query string.
 *
 * Unsplash API guidelines: https://unsplash.com/documentation — respect rate limits (demo tier is limited).
 */

import { createClient } from '@sanity/client'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const token =
  process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_TOKEN
const unsplashKey = process.env.UNSPLASH_ACCESS_KEY?.trim()
const dryRun =
  process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true'
const regenerate =
  process.env.REGENERATE === '1' || process.env.REGENERATE === 'true'
const max = Math.min(
  500,
  Math.max(1, Number.parseInt(process.env.MAX ?? '20', 10) || 20)
)

if (!projectId || !dataset) {
  console.error(
    'Missing NEXT_PUBLIC_SANITY_PROJECT_ID or NEXT_PUBLIC_SANITY_DATASET'
  )
  process.exit(1)
}

if (!unsplashKey) {
  console.error('Missing UNSPLASH_ACCESS_KEY')
  process.exit(1)
}

if (!dryRun && !token) {
  console.error(
    'Missing SANITY_API_WRITE_TOKEN (or SANITY_API_TOKEN). Set DRY_RUN=1 to preview.'
  )
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2023-05-03',
  token: token || 'dry-run',
  useCdn: false,
})

const eligibleNewQuery = `*[
  _type == "birdSighting"
  && !defined(cardImage)
  && imageSuggestionStatus != "pending_review"
  && imageSuggestionStatus != "dismissed"
] | order(observedOn desc) [0...$max]{
  _id,
  speciesName,
  speciesCode,
  locationLabel,
  suggestedCoverSearchQueryManual
}`

const eligibleRegenerateQuery = `*[
  _type == "birdSighting"
  && !defined(cardImage)
  && imageSuggestionStatus == "pending_review"
] | order(observedOn desc) [0...$max]{
  _id,
  speciesName,
  speciesCode,
  locationLabel,
  suggestedCoverSearchQueryManual,
  suggestedCoverSearchPage
}`

function buildSearchQuery(speciesName, speciesCode, locationLabel) {
  const name = (speciesName || '').trim() || 'bird'
  const code = (speciesCode || '').trim()
  const loc = (locationLabel || '').trim()
  // Bias toward Nearctic species to reduce wrong-region wildlife hits (e.g. finches abroad).
  const parts = [name, code, 'wild bird North America']
  if (loc) parts.push(loc)
  return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}

function resolveQuery(doc) {
  const manual = doc.suggestedCoverSearchQueryManual?.trim()
  if (manual) return manual
  return buildSearchQuery(doc.speciesName, doc.speciesCode, doc.locationLabel)
}

async function searchUnsplash(query, page) {
  const u = new URL('https://api.unsplash.com/search/photos')
  u.searchParams.set('query', query)
  u.searchParams.set('per_page', '1')
  u.searchParams.set('orientation', 'landscape')
  u.searchParams.set('page', String(Math.max(1, Math.min(10, page))))

  const res = await fetch(u.toString(), {
    headers: {
      Authorization: `Client-ID ${unsplashKey}`,
      'Accept-Version': 'v1',
    },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Unsplash HTTP ${res.status}: ${body.slice(0, 200)}`)
  }

  const json = await res.json()
  const hit = Array.isArray(json.results) ? json.results[0] : null
  if (!hit) return null

  const urls = hit.urls || {}
  const user = hit.user || {}
  const links = hit.links || {}
  const userLinks = user.links || {}

  const altDescription =
    (typeof hit.alt_description === 'string' && hit.alt_description.trim()) ||
    (typeof hit.description === 'string' && hit.description.trim()) ||
    null

  return {
    imageUrl: urls.regular || urls.small || null,
    photoPageUrl: links.html || null,
    photographerName: typeof user.name === 'string' ? user.name : null,
    photographerPageUrl: userLinks.html || null,
    altDescription,
  }
}

function buildAltDraft(speciesName, locationLabel, altDescription) {
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

async function main() {
  const queryGroq = regenerate ? eligibleRegenerateQuery : eligibleNewQuery
  const docs = await client.fetch(queryGroq, {max})

  if (docs.length === 0) {
    if (regenerate) {
      console.log(
        'No birdSighting documents in pending_review without Card image — nothing to regenerate.'
      )
    } else {
      console.log(
        'No eligible birdSighting documents (need no cardImage, status not pending/dismissed).'
      )
    }
    return
  }

  const modeLabel = regenerate ? 'regenerate' : 'suggest'
  console.log(
    `${dryRun ? '[DRY_RUN] ' : ''}Unsplash ${modeLabel}: processing ${docs.length} sighting(s)…`
  )

  for (const doc of docs) {
    const _id = doc._id
    const name = doc.speciesName || 'bird'
    const query = resolveQuery(doc)

    let apiPage
    if (regenerate) {
      const stored = Number(doc.suggestedCoverSearchPage) || 1
      if (stored >= 10) {
        console.log(
          `  ${_id}: suggestedCoverSearchPage is already ${stored} (max 10). Bump not possible — set a manual Unsplash query or dismiss and re-run a fresh suggestion.`
        )
        continue
      }
      apiPage = Math.min(10, stored + 1)
    } else {
      apiPage = 1
    }

    let suggestion
    try {
      suggestion = await searchUnsplash(query, apiPage)
    } catch (e) {
      console.error(`  ${_id}: Unsplash search failed`, e)
      continue
    }

    if (!suggestion?.imageUrl) {
      console.log(`  ${_id}: no Unsplash results for query="${query}" page=${apiPage}`)
      continue
    }

    const suggestedCoverAltDraft = buildAltDraft(
      name,
      doc.locationLabel,
      suggestion.altDescription
    )

    const patch = {
      suggestedCoverProvider: 'unsplash',
      suggestedCoverImageUrl: suggestion.imageUrl,
      suggestedCoverImagePageUrl: suggestion.photoPageUrl,
      suggestedCoverPhotographerName: suggestion.photographerName,
      suggestedCoverPhotographerPageUrl: suggestion.photographerPageUrl,
      suggestedCoverAltDraft,
      suggestedCoverSearchQueryLast: query,
      suggestedCoverSearchPage: apiPage,
      imageSuggestionStatus: 'pending_review',
    }

    if (dryRun) {
      console.log(
        `  ${_id}: would set pending_review — page=${apiPage} query="${query}" — ${suggestion.imageUrl}`
      )
      continue
    }

    await client.patch(_id).set(patch).commit()
    console.log(`  ${_id}: pending_review — page=${apiPage} query="${query}" — ${suggestion.imageUrl}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
