/**
 * One-shot repair script for birdSighting documents where imageSuggestionStatus
 * was corrupted into an object instead of a string (caused by a now-fixed bug
 * in BirdSightingUnsplashSuggestionPanel that applied cardImage patches relative
 * to the imageSuggestionStatus field path instead of the document root).
 *
 * What it does:
 *  1. Finds all birdSighting drafts + published docs where imageSuggestionStatus
 *     is an object (the corrupted state).
 *  2. For each corrupted doc:
 *     - Rescues the nested cardImage/cardImageAlt if present, promoting them to
 *       document-root fields (only if cardImage isn't already set at the root).
 *     - Resets imageSuggestionStatus to 'none'.
 *
 * Usage:
 *   SANITY_API_WRITE_TOKEN=<editor-token> node scripts/repair-bird-sighting-status.mjs
 *
 * Or with your .env.local loaded:
 *   npx dotenv -e .env.local -- node scripts/repair-bird-sighting-status.mjs
 */

import {createClient} from '@sanity/client'

const token = process.env.SANITY_API_WRITE_TOKEN
if (!token) {
  console.error('Missing SANITY_API_WRITE_TOKEN — set it in your environment or .env.local.')
  process.exit(1)
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'ojv692hs',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2023-05-03',
  token,
  useCdn: false,
})

// Fetch only the corrupted docs where `imageSuggestionStatus` became an object
// containing nested `cardImage` / `cardImageAlt` fields.
//
// For the healthy string state, `imageSuggestionStatus.cardImage` will be null/undefined,
// so `defined(...)` will be false and the doc will not match.
const damaged = await client.fetch(
  `*[
    _type == "birdSighting"
    && (
      defined(imageSuggestionStatus.cardImage)
      || defined(imageSuggestionStatus.cardImageAlt)
    )
  ]{
    _id,
    imageSuggestionStatus,
    cardImage,
    cardImageAlt
  }`,
)

if (damaged.length === 0) {
  console.log('No corrupted documents found — nothing to do.')
  process.exit(0)
}

console.log(`Found ${damaged.length} corrupted document(s):`)
for (const doc of damaged) {
  console.log(`  ${doc._id}`)
}

for (const doc of damaged) {
  const nested = doc.imageSuggestionStatus
  const patch = {imageSuggestionStatus: 'none'}

  // Rescue the nested cardImage/cardImageAlt if they exist and the root fields are empty
  if (nested?.cardImage && !doc.cardImage) {
    patch.cardImage = nested.cardImage
    console.log(`  → rescuing cardImage for ${doc._id}`)
  }
  if (typeof nested?.cardImageAlt === 'string' && !doc.cardImageAlt) {
    patch.cardImageAlt = nested.cardImageAlt
    console.log(`  → rescuing cardImageAlt for ${doc._id}`)
  }

  await client.patch(doc._id).set(patch).commit()
  console.log(`  ✓ repaired ${doc._id}`)
}

console.log('Done.')
