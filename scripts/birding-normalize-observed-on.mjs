#!/usr/bin/env node
/**
 * One-shot: patch birdSighting.observedOn to YYYY-MM-DD for Sanity `date` fields.
 * eBird historically wrote values like "2026-04-30 12:10"; those never get fixed
 * by dashboard sync unless that checklist row is still in the recent API window.
 *
 * Requires NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET,
 * SANITY_API_WRITE_TOKEN (or SANITY_API_TOKEN).
 *
 *   DRY_RUN=1 node --env-file=.env.local scripts/birding-normalize-observed-on.mjs
 *   node --env-file=.env.local scripts/birding-normalize-observed-on.mjs
 */

import { createClient } from '@sanity/client'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const token =
  process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_TOKEN
const dryRun =
  process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true'

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

function observedOnToSanityDate(value) {
  if (!value || typeof value !== 'string' || !value.trim()) return null
  const v = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v
  if (/^\d{4}-\d{2}-\d{2}[ T]/.test(v)) return v.slice(0, 10)
  const t = Date.parse(v)
  if (!Number.isNaN(t)) return new Date(t).toISOString().slice(0, 10)
  if (v.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10)
  return null
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2023-05-03',
  token: token || 'dry-run',
  useCdn: false,
})

const query = `*[_type == "birdSighting" && defined(observedOn)]{_id, observedOn}`

async function main() {
  const rows = await client.fetch(query)
  let patched = 0
  let skipped = 0

  for (const row of rows) {
    const _id = row._id
    const raw = row.observedOn
    const rawStr =
      typeof raw === 'string'
        ? raw
        : raw && typeof raw === 'object' && 'value' in raw
          ? String(raw.value)
          : raw != null
            ? String(raw)
            : ''

    const next = observedOnToSanityDate(rawStr || null)
    const trimmed = rawStr.trim()
    if (!next || next === trimmed) {
      skipped++
      continue
    }

    if (dryRun) {
      console.log(`[DRY_RUN] ${_id} observedOn "${rawStr}" -> "${next}"`)
      patched++
      continue
    }

    await client.patch(_id).set({ observedOn: next }).commit()
    console.log(`  ${_id}: "${rawStr}" -> "${next}"`)
    patched++
  }

  console.log(
    dryRun
      ? `[DRY_RUN] Would patch ${patched} document(s); ${skipped} already OK or unparseable.`
      : `Done. Patched ${patched} document(s); ${skipped} already OK or unparseable.`
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
