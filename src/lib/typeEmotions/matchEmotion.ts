import {
  DEFAULT_EMOTION_ID,
  EMOTION_CATALOG,
  type EmotionEntry,
  type EmotionId,
} from './catalog'

export type EmotionMatch = {
  entry: EmotionEntry
  /** How the match was resolved. */
  via: 'id' | 'exact' | 'scored' | 'fallback'
  /** Phrase or token that contributed most to the match. */
  matchedOn?: string
  /** 0–1 confidence from scored matching. */
  score?: number
  /** Nearby runners-up the user can jump to. */
  alternatives?: EmotionEntry[]
}

const STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'but',
  'of',
  'to',
  'for',
  'in',
  'on',
  'at',
  'with',
  'about',
  'from',
  'into',
  'like',
  'as',
  'is',
  'are',
  'be',
  'been',
  'being',
  'am',
  'i',
  'im',
  'i’m',
  'me',
  'my',
  'we',
  'our',
  'it',
  'its',
  'this',
  'that',
  'these',
  'those',
  'very',
  'really',
  'quite',
  'rather',
  'somewhat',
  'kinda',
  'kind',
  'sort',
  'bit',
  'little',
  'more',
  'less',
  'too',
  'so',
  'just',
  'feel',
  'feeling',
  'feels',
  'felt',
  'emotion',
  'emotions',
  'emotional',
  'mood',
  'moods',
  'vibe',
  'vibes',
  'energy',
  'aesthetic',
  'type',
  'font',
  'fonts',
  'typography',
  'look',
  'looks',
  'looking',
  'want',
  'wanted',
  'needs',
  'need',
  'should',
  'would',
  'could',
  'something',
  'somewhere',
  'today',
  'now',
  'please',
])

const SUFFIXES = [
  'iness',
  'ness',
  'ingly',
  'edly',
  'ally',
  'ing',
  'ied',
  'ed',
  'ly',
  'ful',
  'ous',
  'ive',
  'ian',
  'tion',
  'sion',
  'ment',
  'able',
  'ible',
  'est',
  'er',
] as const

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
}

function findById(id: string, catalog: EmotionEntry[]): EmotionEntry | undefined {
  return catalog.find((entry) => entry.id === id)
}

/**
 * Resolve a chip id or free-text emotion phrase to a curated catalog entry.
 * Uses stopword stripping + stem/prefix scoring so everyday phrasing still maps.
 */
export function matchEmotion(
  query: string,
  catalog: EmotionEntry[] = EMOTION_CATALOG,
): EmotionMatch {
  const raw = query.trim()
  if (!raw) {
    return {entry: findById(DEFAULT_EMOTION_ID, catalog)!, via: 'fallback', score: 0}
  }

  const normalized = normalize(raw)
  const asId = normalized.replace(/\s+/g, '-') as EmotionId
  const byId = findById(asId, catalog)
  if (byId) {
    return {entry: byId, via: 'id', matchedOn: byId.id, score: 1}
  }

  // Exact label / synonym equality on the whole query
  for (const entry of catalog) {
    const exactTerms = [entry.id, entry.label.toLowerCase(), ...entry.synonyms.map((s) => s.toLowerCase())]
    if (exactTerms.includes(normalized)) {
      return {entry, via: 'exact', matchedOn: normalized, score: 1}
    }
  }

  const tokens = tokenize(normalized)
  if (tokens.length === 0) {
    return {entry: findById(DEFAULT_EMOTION_ID, catalog)!, via: 'fallback', score: 0}
  }

  const scored: ScoredCandidate[] = []
  for (const entry of catalog) {
    const candidate = scoreEntry(entry, normalized, tokens)
    if (candidate) scored.push(candidate)
  }

  if (scored.length === 0) {
    return {entry: findById(DEFAULT_EMOTION_ID, catalog)!, via: 'fallback', score: 0}
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if (b.matchedLen !== a.matchedLen) return b.matchedLen - a.matchedLen
    // Prefer a non-default when scores tie so “soft” collisions lose to more specific cues.
    if (a.entry.id === DEFAULT_EMOTION_ID) return 1
    if (b.entry.id === DEFAULT_EMOTION_ID) return -1
    return a.entry.label.localeCompare(b.entry.label)
  })

  const best = scored[0]!
  const alternatives = scored.slice(1, 4).map((c) => c.entry)
  // Soft normalize: one strong token ≈ 0.85; cap at 1
  const confidence = Math.min(1, best.score / 0.85)

  return {
    entry: best.entry,
    via: 'scored',
    matchedOn: best.matchedOn,
    score: Number(confidence.toFixed(2)),
    alternatives: alternatives.length > 0 ? alternatives : undefined,
  }
}

function stems(token: string): string[] {
  const out = new Set<string>([token])
  for (const suffix of SUFFIXES) {
    if (token.endsWith(suffix) && token.length - suffix.length >= 3) {
      out.add(token.slice(0, -suffix.length))
    }
  }
  // light plural / third-person
  if (token.endsWith('ies') && token.length > 4) out.add(`${token.slice(0, -3)}y`)
  if (token.endsWith('es') && token.length > 4) out.add(token.slice(0, -2))
  if (token.endsWith('s') && !token.endsWith('ss') && token.length > 3) out.add(token.slice(0, -1))
  return [...out]
}

function tokenize(normalized: string): string[] {
  return normalized
    .split(' ')
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t))
}

type LexiconHit = {
  term: string
  weight: number
}

function lexiconFor(entry: EmotionEntry): LexiconHit[] {
  const hits: LexiconHit[] = [
    {term: entry.id, weight: 1},
    {term: entry.label.toLowerCase(), weight: 1},
  ]
  for (const synonym of entry.synonyms) {
    const term = synonym.toLowerCase()
    // Multi-word cues are more specific than single tokens.
    hits.push({term, weight: term.includes(' ') ? 0.95 : 0.85})
  }
  return hits
}

type ScoredCandidate = {
  entry: EmotionEntry
  score: number
  matchedOn: string
  matchedLen: number
}

function scoreEntry(entry: EmotionEntry, normalized: string, tokens: string[]): ScoredCandidate | null {
  const lexicon = lexiconFor(entry)
  let score = 0
  let matchedOn = ''
  let matchedLen = 0

  for (const {term, weight} of lexicon) {
    if (term.length < 2) continue

    // Full-phrase containment (“a bit restless and wired”)
    if (term.includes(' ')) {
      if (normalized.includes(term)) {
        score += weight
        if (term.length >= matchedLen) {
          matchedOn = term
          matchedLen = term.length
        }
      }
      continue
    }

    for (const token of tokens) {
      const tokenStems = stems(token)
      const termStems = stems(term)

      if (token === term || tokenStems.some((s) => termStems.includes(s))) {
        score += weight
        if (term.length >= matchedLen) {
          matchedOn = term
          matchedLen = term.length
        }
        continue
      }

      // Prefix for longer words (anx → anxious, romanti → romantic)
      const minLen = Math.min(token.length, term.length)
      if (minLen >= 4 && (token.startsWith(term) || term.startsWith(token))) {
        const overlap = minLen / Math.max(token.length, term.length)
        const partial = weight * 0.55 * overlap
        score += partial
        if (term.length >= matchedLen) {
          matchedOn = term
          matchedLen = term.length
        }
      }
    }
  }

  if (score <= 0) return null
  return {entry, score, matchedOn, matchedLen}
}
