import 'server-only'
import {createServerSupabase} from '@/lib/supabase/server'
import {isValidCaseStudySlug} from '@/lib/caseStudy/access'

export const CASE_STUDY_PDF_BUCKET = 'case-study-pdfs'

export type CaseStudyAccessRow = {
  slug: string
  salt: string
  hash: string
  pdf_object_key: string | null
  original_filename: string | null
  mime_type: string | null
}

export function pdfObjectKeyForSlug(slug: string, originalFilename?: string | null): string {
  const safeName = (originalFilename || 'case-study.pdf')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120)
  return `${slug}/${Date.now()}-${safeName.endsWith('.pdf') ? safeName : `${safeName}.pdf`}`
}

export async function getCaseStudyAccess(slug: string): Promise<CaseStudyAccessRow | null> {
  if (!isValidCaseStudySlug(slug)) return null
  const supabase = createServerSupabase()
  const {data, error} = await supabase
    .from('case_study_access')
    .select('slug, salt, hash, pdf_object_key, original_filename, mime_type')
    .eq('slug', slug)
    .maybeSingle()
  if (error) {
    console.error('[caseStudy] getCaseStudyAccess failed', {slug, error: error.message})
    return null
  }
  return data
}

export async function upsertCaseStudyPassword(input: {
  slug: string
  salt: string
  hash: string
}): Promise<{ok: true} | {ok: false; message: string}> {
  if (!isValidCaseStudySlug(input.slug)) {
    return {ok: false, message: 'Invalid slug.'}
  }
  const supabase = createServerSupabase()
  const {error} = await supabase.from('case_study_access').upsert(
    {
      slug: input.slug,
      salt: input.salt,
      hash: input.hash,
    },
    {onConflict: 'slug'},
  )
  if (error) {
    console.error('[caseStudy] upsertCaseStudyPassword failed', {
      slug: input.slug,
      error: error.message,
    })
    return {ok: false, message: 'Could not store password.'}
  }
  return {ok: true}
}

export async function clearCaseStudyPassword(
  slug: string,
): Promise<{ok: true} | {ok: false; message: string}> {
  if (!isValidCaseStudySlug(slug)) return {ok: false, message: 'Invalid slug.'}
  const existing = await getCaseStudyAccess(slug)
  if (!existing) return {ok: true}
  if (existing.pdf_object_key) {
    return {
      ok: false,
      message: 'Replace the password instead of clearing it while a PDF is stored.',
    }
  }
  const supabase = createServerSupabase()
  const {error} = await supabase.from('case_study_access').delete().eq('slug', slug)
  if (error) {
    return {ok: false, message: 'Could not clear access.'}
  }
  return {ok: true}
}

export async function uploadCaseStudyPdf(input: {
  slug: string
  bytes: ArrayBuffer | Buffer | Uint8Array
  originalFilename: string
  mimeType?: string
}): Promise<{ok: true; objectKey: string} | {ok: false; message: string}> {
  if (!isValidCaseStudySlug(input.slug)) {
    return {ok: false, message: 'Invalid slug.'}
  }
  const mimeType = input.mimeType || 'application/pdf'
  if (mimeType !== 'application/pdf') {
    return {ok: false, message: 'Only PDF uploads are allowed.'}
  }

  const supabase = createServerSupabase()
  const existing = await getCaseStudyAccess(input.slug)
  if (!existing?.salt || !existing?.hash) {
    return {
      ok: false,
      message: 'Set an access password before uploading the PDF.',
    }
  }

  const objectKey = pdfObjectKeyForSlug(input.slug, input.originalFilename)
  const body =
    input.bytes instanceof Uint8Array
      ? input.bytes
      : new Uint8Array(input.bytes as ArrayBuffer)

  const {error: uploadError} = await supabase.storage
    .from(CASE_STUDY_PDF_BUCKET)
    .upload(objectKey, body, {
      contentType: mimeType,
      upsert: false,
    })

  if (uploadError) {
    console.error('[caseStudy] upload failed', {slug: input.slug, error: uploadError.message})
    return {ok: false, message: 'Could not upload PDF.'}
  }

  if (existing.pdf_object_key && existing.pdf_object_key !== objectKey) {
    await supabase.storage.from(CASE_STUDY_PDF_BUCKET).remove([existing.pdf_object_key])
  }

  const {error: updateError} = await supabase
    .from('case_study_access')
    .update({
      pdf_object_key: objectKey,
      original_filename: input.originalFilename,
      mime_type: mimeType,
    })
    .eq('slug', input.slug)

  if (updateError) {
    await supabase.storage.from(CASE_STUDY_PDF_BUCKET).remove([objectKey])
    console.error('[caseStudy] pdf metadata update failed', {
      slug: input.slug,
      error: updateError.message,
    })
    return {ok: false, message: 'Could not save PDF metadata.'}
  }

  return {ok: true, objectKey}
}

export async function downloadCaseStudyPdf(
  slug: string,
): Promise<
  | {ok: true; bytes: Blob; mimeType: string; originalFilename: string}
  | {ok: false; status: 404 | 502; message: string}
> {
  const row = await getCaseStudyAccess(slug)
  if (!row?.pdf_object_key) {
    return {ok: false, status: 404, message: 'Not found'}
  }

  const supabase = createServerSupabase()
  const {data, error} = await supabase.storage
    .from(CASE_STUDY_PDF_BUCKET)
    .download(row.pdf_object_key)

  if (error || !data) {
    console.error('[caseStudy] download failed', {slug, error: error?.message})
    return {ok: false, status: 502, message: 'Unable to load PDF'}
  }

  return {
    ok: true,
    bytes: data,
    mimeType: row.mime_type || 'application/pdf',
    originalFilename: row.original_filename || `${slug}.pdf`,
  }
}

/** Migration helper: upsert password + PDF key in one shot (password already hashed). */
export async function upsertCaseStudyAccessFull(input: {
  slug: string
  salt: string
  hash: string
  pdfObjectKey: string
  originalFilename: string
  mimeType?: string
}): Promise<{ok: true} | {ok: false; message: string}> {
  if (!isValidCaseStudySlug(input.slug)) {
    return {ok: false, message: 'Invalid slug.'}
  }
  const supabase = createServerSupabase()
  const {error} = await supabase.from('case_study_access').upsert(
    {
      slug: input.slug,
      salt: input.salt,
      hash: input.hash,
      pdf_object_key: input.pdfObjectKey,
      original_filename: input.originalFilename,
      mime_type: input.mimeType || 'application/pdf',
    },
    {onConflict: 'slug'},
  )
  if (error) {
    return {ok: false, message: error.message}
  }
  return {ok: true}
}
