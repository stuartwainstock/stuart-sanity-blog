#!/usr/bin/env node
/**
 * One-time migration: convert post.featured from legacy strings ("true"/"false")
 * to booleans. Run after schema defines featured as boolean.
 *
 * Requires env:
 *   NEXT_PUBLIC_SANITY_PROJECT_ID
 *   NEXT_PUBLIC_SANITY_DATASET
 *   SANITY_API_WRITE_TOKEN (or SANITY_API_TOKEN) — Editor or write token
 *
 * Usage:
 *   DRY_RUN=1 node scripts/migrate-featured-to-boolean.mjs   # log only
 *   node scripts/migrate-featured-to-boolean.mjs             # apply patches
 *
 * Load .env.local from repo root, e.g.:
 *   node --env-file=.env.local scripts/migrate-featured-to-boolean.mjs
 */

import { createClient } from '@sanity/client'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const token =
  process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_TOKEN
const dryRun =
  process.env.DRY_RUN === '1' ||
  process.env.DRY_RUN === 'true'

if (!projectId || !dataset) {
  console.error(
    'Missing NEXT_PUBLIC_SANITY_PROJECT_ID or NEXT_PUBLIC_SANITY_DATASET'
  )
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

async function fetchAllPosts() {
  // Published posts (ids without drafts. prefix)
  const published = await client.fetch(
    `*[_type == "post" && !(_id in path("drafts.*"))]{_id, featured}`
  )
  // Draft-only and draft overlays (drafts.*)
  const drafts = await client.fetch(
    `*[_type == "post" && _id in path("drafts.*")]{_id, featured}`
  )
  return [...published, ...drafts]
}

async function main() {
  const docs = await fetchAllPosts()
  console.log(`Found ${docs.length} post document(s) (published + drafts).`)

  let updated = 0
  let skipped = 0

  for (const doc of docs) {
    const f = doc.featured
    if (typeof f === 'boolean') {
      skipped++
      continue
    }
    if (typeof f !== 'string') {
      skipped++
      continue
    }

    const next = f === 'true'
    updated++
    if (dryRun) {
      console.log(`[dry-run] ${doc._id} featured: "${f}" -> ${next}`)
      continue
    }

    await client.patch(doc._id).set({ featured: next }).commit()
    console.log(`Updated ${doc._id} -> featured: ${next}`)
  }

  console.log(
    dryRun
      ? `Dry run: would update ${updated} document(s), skip ${skipped} (already boolean or non-string).`
      : `Done: updated ${updated} document(s), skipped ${skipped}.`
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
