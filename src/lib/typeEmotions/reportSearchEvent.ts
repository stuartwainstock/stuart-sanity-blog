import type {EmotionMatch} from './matchEmotion'

export type SearchEventKind = 'fallback' | 'weak' | 'feedback'

const WEAK_SCORE_MAX = 0.45

/** Whether this match should be auto-logged for lexicon review. */
export function autoLogKind(match: EmotionMatch): SearchEventKind | null {
  if (match.via === 'fallback') return 'fallback'
  if (match.via === 'scored' && typeof match.score === 'number' && match.score < WEAK_SCORE_MAX) {
    return 'weak'
  }
  return null
}

export async function reportTypeEmotionSearchEvent(input: {
  query: string
  kind: SearchEventKind
  match: EmotionMatch
}): Promise<void> {
  const query = input.query.trim()
  if (!query) return

  try {
    await fetch('/api/type-emotions/search-events', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        query,
        kind: input.kind,
        matchedEmotionId: input.match.entry.id,
        matchedVia: input.match.via,
        matchedOn: input.match.matchedOn ?? null,
        score: input.match.score ?? null,
      }),
      keepalive: true,
    })
  } catch {
    // Fire-and-forget — never block the specimen UI.
  }
}
