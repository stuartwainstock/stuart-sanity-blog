import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'

/**
 * On-demand ISR: call from a Sanity webhook when content changes so the site
 * refreshes without a git deploy. Configure in Sanity Manage → API → Webhooks:
 *   URL: https://YOUR_DOMAIN/api/revalidate?secret=YOUR_SECRET
 *   Trigger on create / update / delete (published documents).
 *
 * Set SANITY_REVALIDATE_SECRET in Vercel (and .env.local) to match the query param.
 */

type SlugField = { current?: string }

type WebhookPayload = {
  _type?: string
  slug?: SlugField
  result?: {_type?: string; slug?: SlugField}
  /** Some webhook templates nest the document */
  document?: {_type?: string; slug?: SlugField}
}

function pickDocument(payload: WebhookPayload | null): WebhookPayload | null {
  if (!payload) return null
  return payload.result ?? payload.document ?? payload
}

export async function POST(req: NextRequest) {
  const searchSecret = req.nextUrl.searchParams.get('secret')
  const headerSecret = req.headers
    .get('authorization')
    ?.replace(/^Bearer\s+/i, '')
    .trim()
  const secret = searchSecret || headerSecret
  const expected = process.env.SANITY_REVALIDATE_SECRET

  if (!expected || secret !== expected) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  let payload: WebhookPayload | null = null
  try {
    const text = await req.text()
    if (text) payload = JSON.parse(text) as WebhookPayload
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 })
  }

  const doc = pickDocument(payload)
  const type = doc?._type ?? payload?._type
  const slug = doc?.slug?.current

  const revalidated: string[] = []

  const touch = (path: string) => {
    revalidatePath(path)
    revalidated.push(path)
  }

  switch (type) {
    case 'post':
      touch('/journal')
      touch('/blog')
      if (slug) touch(`/journal/${slug}`)
      break
    case 'page':
      if (slug) touch(`/${slug}`)
      break
    case 'author':
      if (slug) touch(`/author/${slug}`)
      break
    case 'category':
      if (slug) touch(`/category/${slug}`)
      break
    case 'homepage':
      touch('/')
      break
    case 'siteSettings':
      revalidatePath('/', 'layout')
      revalidated.push('layout:/')
      touch('/')
      break
    case 'resource':
      touch('/reading-list')
      break
    default:
      // Unknown _type or payload shape: still bust main surfaces (safe for small sites)
      touch('/')
      touch('/journal')
      touch('/blog')
      break
  }

  return NextResponse.json({
    ok: true,
    type: type ?? 'unknown',
    slug: slug ?? null,
    revalidated,
  })
}
