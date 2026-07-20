#!/usr/bin/env node
/**
 * Migrate existing case-study PDFs + password hashes out of the public Sanity
 * dataset/CDN into private Supabase Storage + case_study_access.
 *
 * Usage (from repo root):
 *   node --env-file=.env.local scripts/migrate-case-study-pdfs-to-supabase.mjs
 *   DRY_RUN=1 node --env-file=.env.local scripts/migrate-case-study-pdfs-to-supabase.mjs
 *
 * Prerequisites:
 *   - scripts/supabase-case-study-access.sql applied
 *   - SANITY_API_WRITE_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   - NEXT_PUBLIC_SANITY_PROJECT_ID / DATASET
 *
 * After a successful run, old cdn.sanity.io URLs are deleted (assets removed).
 * Rotate share passwords if they may have been weak (hashes were public).
 */

import {createClient} from '@sanity/client'
import {createClient as createSupabase} from '@supabase/supabase-js'

const DRY_RUN = process.env.DRY_RUN === '1'
const BUCKET = 'case-study-pdfs'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const token = process.env.SANITY_API_WRITE_TOKEN
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!projectId || !dataset || !token) {
  console.error('Missing Sanity env (project, dataset, SANITY_API_WRITE_TOKEN).')
  process.exit(1)
}
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).')
  process.exit(1)
}

const sanity = createClient({
  projectId,
  dataset,
  apiVersion: '2023-05-03',
  token,
  useCdn: false,
})

const supabase = createSupabase(supabaseUrl, supabaseKey, {
  auth: {persistSession: false, autoRefreshToken: false},
})

const docs = await sanity.fetch(`*[
  _type == "caseStudy"
  && defined(slug.current)
]{
  _id,
  title,
  "slug": slug.current,
  "salt": access.salt,
  "hash": access.hash,
  "accessConfigured": access.configured,
  "pdfConfigured": pdfProtection.configured,
  pdfFile {
    asset->{
      _id,
      url,
      originalFilename,
      mimeType
    }
  }
}`)

console.log(`Found ${docs.length} case studies. DRY_RUN=${DRY_RUN ? '1' : '0'}`)

for (const doc of docs) {
  const slug = doc.slug
  console.log(`\n—— ${slug} (${doc.title}) ——`)

  const salt = doc.salt
  const hash = doc.hash
  const asset = doc.pdfFile?.asset
  const alreadyPrivate = doc.pdfConfigured === 'yes' && !asset?.url

  if (alreadyPrivate && !salt && !hash) {
    console.log('Already migrated (flags only, no public asset). Skipping.')
    continue
  }

  if (!salt || !hash) {
    console.warn('Missing salt/hash in Sanity — cannot migrate credentials for this doc.')
    if (!asset?.url) continue
  }

  if (!asset?.url) {
    console.warn('No public PDF asset URL — skipping file migration.')
    if (salt && hash && !DRY_RUN) {
      const {error} = await supabase.from('case_study_access').upsert(
        {slug, salt, hash},
        {onConflict: 'slug'},
      )
      if (error) console.error('Upsert password failed:', error.message)
      else {
        await sanity
          .patch(doc._id)
          .set({access: {_type: 'caseStudyAccess', configured: 'yes'}})
          .unset(['access.salt', 'access.hash'])
          .commit()
        console.log('Migrated password only; cleared public salt/hash.')
      }
    }
    continue
  }

  console.log(`Downloading ${asset.url}`)
  const pdfRes = await fetch(asset.url)
  if (!pdfRes.ok) {
    console.error(`Download failed: ${pdfRes.status}`)
    continue
  }
  const bytes = Buffer.from(await pdfRes.arrayBuffer())
  const originalFilename = asset.originalFilename || `${slug}.pdf`
  const objectKey = `${slug}/${Date.now()}-${originalFilename.replace(/[^a-zA-Z0-9._-]+/g, '-')}`

  if (DRY_RUN) {
    console.log(`[dry-run] would upload ${objectKey} (${bytes.length} bytes) and delete asset ${asset._id}`)
    continue
  }

  const {error: uploadError} = await supabase.storage.from(BUCKET).upload(objectKey, bytes, {
    contentType: asset.mimeType || 'application/pdf',
    upsert: false,
  })
  if (uploadError) {
    console.error('Upload failed:', uploadError.message)
    continue
  }

  const {error: upsertError} = await supabase.from('case_study_access').upsert(
    {
      slug,
      salt,
      hash,
      pdf_object_key: objectKey,
      original_filename: originalFilename,
      mime_type: asset.mimeType || 'application/pdf',
    },
    {onConflict: 'slug'},
  )
  if (upsertError) {
    console.error('Upsert failed:', upsertError.message)
    await supabase.storage.from(BUCKET).remove([objectKey])
    continue
  }

  await sanity
    .patch(doc._id)
    .set({
      access: {_type: 'caseStudyAccess', configured: 'yes'},
      pdfProtection: {
        _type: 'caseStudyPdfProtection',
        configured: 'yes',
        originalFilename,
      },
    })
    .unset(['pdfFile', 'access.salt', 'access.hash'])
    .commit()

  try {
    await sanity.delete(asset._id)
    console.log(`Deleted Sanity asset ${asset._id}`)
  } catch (err) {
    console.warn('Could not delete Sanity asset (may still be referenced):', err.message || err)
  }

  console.log('Migrated OK.')
}

console.log('\nDone.')
