import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import ogs from 'open-graph-scraper'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const sanityWriteToken = process.env.SANITY_API_WRITE_TOKEN
const addLinkApiKey = process.env.QUICK_ADD_API_KEY

const hasSanityConfig = Boolean(projectId && dataset && sanityWriteToken)

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const incomingApiKey = request.headers.get('x-api-key')
  if (!addLinkApiKey || incomingApiKey !== addLinkApiKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!hasSanityConfig) {
    return NextResponse.json(
      { error: 'Server is missing Sanity write configuration.' },
      { status: 500 }
    )
  }

  let body: { url?: string } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const url = body.url?.trim()
  if (!url || !isValidUrl(url)) {
    return NextResponse.json({ error: 'Please provide a valid URL.' }, { status: 400 })
  }

  try {
    const { result, error } = await ogs({ url, timeout: 10000 })
    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch metadata: ${error}` },
        { status: 422 }
      )
    }

    const title =
      result.ogTitle ||
      result.twitterTitle ||
      result.dcTitle ||
      url
    const summary =
      result.ogDescription ||
      result.twitterDescription ||
      result.dcDescription ||
      ''
    const image =
      result.ogImage?.[0]?.url ||
      result.twitterImage?.[0]?.url ||
      ''

    const client = createClient({
      projectId,
      dataset,
      apiVersion: '2023-05-03',
      token: sanityWriteToken,
      useCdn: false,
    })

    const created = await client.create({
      _type: 'link',
      title,
      url,
      summary,
      image,
      addedDate: new Date().toISOString(),
    })

    return NextResponse.json(
      { ok: true, id: created._id, title: created.title, url: created.url },
      { status: 201 }
    )
  } catch (err) {
    console.error('Failed to add link:', err)
    return NextResponse.json(
      { error: 'Unexpected server error while adding link.' },
      { status: 500 }
    )
  }
}
