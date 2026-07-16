import {NextResponse} from 'next/server'
import {hasValidAdminSession} from '@/lib/admin/session'
import {getSanityWriteClient} from '@/lib/sanity.server'
import {createServerSupabase} from '@/lib/supabase/server'

export const runtime = 'nodejs'

const RESOLUTIONS = new Set(['applied', 'dismissed', 'needs_content'] as const)
type Resolution = 'applied' | 'dismissed' | 'needs_content'

type Body = {
  eventId?: unknown
  action?: unknown
  /** Required for addSynonym — which typeEmotion.emotionId to patch. */
  emotionId?: unknown
  /** Synonym text to append (defaults to the event query). */
  synonym?: unknown
}

function asTrimmedString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, max)
}

export async function POST(request: Request) {
  const allowed = await hasValidAdminSession()
  if (!allowed) {
    return NextResponse.json({error: 'Unauthorized'}, {status: 401})
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({error: 'Invalid JSON'}, {status: 400})
  }

  const eventId = asTrimmedString(body.eventId, 64)
  const action = asTrimmedString(body.action, 32)
  if (!eventId || !action) {
    return NextResponse.json({error: 'eventId and action are required'}, {status: 400})
  }

  const supabase = createServerSupabase()
  const {data: event, error: loadError} = await supabase
    .from('type_emotion_search_events')
    .select('id, query, matched_emotion_id, reviewed_at')
    .eq('id', eventId)
    .maybeSingle()

  if (loadError || !event) {
    return NextResponse.json({error: 'Event not found'}, {status: 404})
  }

  if (event.reviewed_at) {
    return NextResponse.json({error: 'Already reviewed'}, {status: 409})
  }

  let resolution: Resolution
  if (action === 'dismiss') {
    resolution = 'dismissed'
  } else if (action === 'needsContent') {
    resolution = 'needs_content'
  } else if (action === 'addSynonym') {
    resolution = 'applied'
    const emotionId =
      asTrimmedString(body.emotionId, 64) ||
      asTrimmedString(event.matched_emotion_id, 64)
    const synonym =
      asTrimmedString(body.synonym, 200) || asTrimmedString(event.query, 200)
    if (!emotionId || !synonym) {
      return NextResponse.json(
        {error: 'emotionId and synonym are required for addSynonym'},
        {status: 400},
      )
    }

    try {
      const client = getSanityWriteClient()
      const docs = await client.fetch<Array<{_id: string; synonyms?: string[]}>>(
        `*[_type == "typeEmotion" && emotionId.current == $emotionId]{_id, synonyms}`,
        {emotionId},
      )
      const doc = docs[0]
      if (!doc?._id) {
        return NextResponse.json({error: `No typeEmotion for id “${emotionId}”`}, {status: 404})
      }

      const existing = (doc.synonyms ?? []).map((s) => s.toLowerCase())
      if (!existing.includes(synonym.toLowerCase())) {
        await client
          .patch(doc._id)
          .setIfMissing({synonyms: []})
          .append('synonyms', [synonym])
          .commit({autoGenerateArrayKeys: true})
      }
    } catch (err) {
      console.error('[type-emotions/review] Sanity patch failed', err)
      return NextResponse.json({error: 'Sanity patch failed'}, {status: 500})
    }
  } else {
    return NextResponse.json({error: 'Unknown action'}, {status: 400})
  }

  if (!RESOLUTIONS.has(resolution)) {
    return NextResponse.json({error: 'Invalid resolution'}, {status: 400})
  }

  const {error: updateError} = await supabase
    .from('type_emotion_search_events')
    .update({
      reviewed_at: new Date().toISOString(),
      reviewed_by: 'admin',
      resolution,
    })
    .eq('id', eventId)

  if (updateError) {
    console.error('[type-emotions/review]', updateError.message)
    return NextResponse.json({error: 'Failed to mark reviewed'}, {status: 500})
  }

  return NextResponse.json({ok: true, resolution})
}
