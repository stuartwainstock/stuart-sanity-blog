import {NextResponse} from 'next/server'
import {createServerSupabase} from '@/lib/supabase/server'

export const runtime = 'nodejs'

const KINDS = new Set(['fallback', 'weak', 'feedback'] as const)
type EventKind = 'fallback' | 'weak' | 'feedback'

type Body = {
  query?: unknown
  kind?: unknown
  matchedEmotionId?: unknown
  matchedVia?: unknown
  matchedOn?: unknown
  score?: unknown
}

function asTrimmedString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, max)
}

export async function POST(request: Request) {
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({error: 'Invalid JSON'}, {status: 400})
  }

  const query = asTrimmedString(body.query, 200)
  const kindRaw = asTrimmedString(body.kind, 32)
  if (!query || !kindRaw || !KINDS.has(kindRaw as EventKind)) {
    return NextResponse.json({error: 'query and kind are required'}, {status: 400})
  }

  const kind = kindRaw as EventKind
  const matchedEmotionId = asTrimmedString(body.matchedEmotionId, 64)
  const matchedVia = asTrimmedString(body.matchedVia, 32)
  const matchedOn = asTrimmedString(body.matchedOn, 64)
  const score =
    typeof body.score === 'number' && Number.isFinite(body.score)
      ? Math.min(1, Math.max(0, body.score))
      : null

  try {
    const supabase = createServerSupabase()
    const {error} = await supabase.from('type_emotion_search_events').insert({
      query,
      kind,
      matched_emotion_id: matchedEmotionId,
      matched_via: matchedVia,
      matched_on: matchedOn,
      score,
      user_agent: request.headers.get('user-agent')?.slice(0, 300) ?? null,
    })

    if (error) {
      console.error('[type-emotions/search-events]', error.message)
      return NextResponse.json({error: 'Failed to save'}, {status: 500})
    }

    return NextResponse.json({ok: true})
  } catch (err) {
    console.error('[type-emotions/search-events]', err)
    return NextResponse.json({error: 'Unavailable'}, {status: 503})
  }
}
