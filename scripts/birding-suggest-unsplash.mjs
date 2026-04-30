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

const eligibleQuery = `*[
  _type == "birdSighting"
  && !defined(cardImage)
  && imageSuggestionStatus != "pending_review"
  && imageSuggestionStatus != "dismissed"
] | order(observedOn desc) [0...$max]{
  _id,
  speciesName
}`

async function searchUnsplashFirst(query) {
  const u = new URL('https://api.unsplash.com/search/photos')
  u.searchParams.set('query', query)
  u.searchParams.set('per_page', '1')
  u.searchParams.set('orientation', 'landscape')

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

  return {
    imageUrl: urls.regular || urls.small || null,
    photoPageUrl: links.html || null,
    photographerName: typeof user.name === 'string' ? user.name : null,
    photographerPageUrl: userLinks.html || null,
  }
}

async function main() {
  const docs = await client.fetch(eligibleQuery, {max})
  if (docs.length === 0) {
    console.log('No eligible birdSighting documents (need no cardImage, status not pending/dismissed).')
    return
  }

  console.log(
    `${dryRun ? '[DRY_RUN] ' : ''}Suggesting Unsplash previews for ${docs.length} sighting(s)…`
  )

  for (const doc of docs) {
    const _id = doc._id
    const name = doc.speciesName || 'bird'
    const query = `${name} bird`
    let suggestion
    try {
      suggestion = await searchUnsplashFirst(query)
    } catch (e) {
      console.error(`  ${_id}: Unsplash search failed`, e)
      continue
    }

    if (!suggestion?.imageUrl) {
      console.log(`  ${_id}: no Unsplash results for "${query}"`)
      continue
    }

    const suggestedCoverAltDraft = `Photograph of a ${name} (verify species match before publishing).`

    const patch = {
      suggestedCoverProvider: 'unsplash',
      suggestedCoverImageUrl: suggestion.imageUrl,
      suggestedCoverImagePageUrl: suggestion.photoPageUrl,
      suggestedCoverPhotographerName: suggestion.photographerName,
      suggestedCoverPhotographerPageUrl: suggestion.photographerPageUrl,
      suggestedCoverAltDraft,
      imageSuggestionStatus: 'pending_review',
    }

    if (dryRun) {
      console.log(`  ${_id}: would set pending_review — ${suggestion.imageUrl}`)
      continue
    }

    await client.patch(_id).set(patch).commit()
    console.log(`  ${_id}: pending_review — ${suggestion.imageUrl}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
