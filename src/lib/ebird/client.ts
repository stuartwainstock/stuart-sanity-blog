import type {ResolvedEbirdBirding} from '@/lib/ebird/resolveConfig'
import type {
  BirdObservation,
  EbirdObservationsResult,
} from '@/lib/ebird/types'
import type {EbirdBirding} from '@/lib/types'

const EBIRD_BASE = 'https://api.ebird.org/v2'

function getApiKey(): string | null {
  const k = process.env.EBIRD_API_KEY?.trim()
  return k || null
}

function ebirdHeaders(): HeadersInit {
  const key = getApiKey()
  return {
    Accept: 'application/json',
    'X-eBirdApiToken': key || '',
  }
}

async function ebirdFetch(
  path: string,
  searchParams: URLSearchParams,
  revalidateSeconds: number,
  options?: {revalidateOverride?: number}
): Promise<Response> {
  const url = `${EBIRD_BASE}${path}?${searchParams.toString()}`
  const revalidate =
    options?.revalidateOverride ?? revalidateSeconds
  return fetch(url, {
    headers: ebirdHeaders(),
    next: {revalidate},
  })
}

function pickSubId(o: Record<string, unknown>): string | undefined {
  const v = o.subId ?? o.subID
  if (typeof v === 'string' && v.length > 0) return v
  if (v != null && typeof v !== 'object') return String(v)
  return undefined
}

function pickObserverDisplayName(o: Record<string, unknown>): string | null {
  const full = o.userDisplayName
  if (typeof full === 'string' && full.trim()) return full.trim()
  const first = typeof o.firstName === 'string' ? o.firstName.trim() : ''
  const last = typeof o.lastName === 'string' ? o.lastName.trim() : ''
  const joined = [first, last].filter(Boolean).join(' ').trim()
  return joined || null
}

export function parseHotspotCodes(raw: string | undefined): string[] {
  if (!raw?.trim()) return []
  return raw
    .split(/[\s,]+/)
    .map((s) => {
      const t = s.trim()
      if (!t) return ''
      const withL = /^l/i.test(t) ? t.replace(/^l/i, 'L') : `L${t}`
      return withL
    })
    .filter((s) => /^L\d+$/i.test(s))
}

/** Published config has a region or at least one hotspot for map + list. */
export function ebirdHasMapArea(raw: EbirdBirding | null): boolean {
  if (!raw) return false
  if (raw.mapDataSource === 'region') {
    return Boolean(raw.regionCode?.trim())
  }
  return parseHotspotCodes(raw.hotspotCodes).length > 0
}

function recentObsPath(loc: string, speciesCode: string): string {
  return `/data/obs/${encodeURIComponent(loc)}/recent/${encodeURIComponent(speciesCode)}`
}

function recentAllSpeciesPath(loc: string): string {
  return `/data/obs/${encodeURIComponent(loc)}/recent`
}

function normalizeRecentObs(
  rows: Record<string, unknown>[]
): BirdObservation[] {
  const out: BirdObservation[] = []
  for (const o of rows) {
    const lat = Number(o.lat)
    const lng = Number(o.lng)
    const subId = pickSubId(o)
    const comName = (o.comName as string) || 'Unknown'
    const speciesCode = (o.speciesCode as string) || ''
    const obsDt = (o.obsDt as string) || null
    const locName = (o.locName as string) || null
    const observerDisplayName = pickObserverDisplayName(o)

    if (
      subId == null ||
      Number.isNaN(lat) ||
      Number.isNaN(lng) ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      continue
    }

    const id = `${subId}:${speciesCode}:${obsDt || ''}`
    out.push({
      id,
      observedOn: obsDt,
      latitude: lat,
      longitude: lng,
      speciesName: comName,
      speciesCode,
      checklistUri: `https://ebird.org/checklist/${subId}`,
      locationLabel: locName,
      observerDisplayName,
    })
  }
  return out
}

function sortObsDesc(a: BirdObservation, b: BirdObservation): number {
  const da = a.observedOn || ''
  const db = b.observedOn || ''
  return db.localeCompare(da)
}

export async function fetchMapObservations(
  config: ResolvedEbirdBirding,
  revalidateSeconds = 300
): Promise<EbirdObservationsResult> {
  const key = getApiKey()
  if (!key) {
    return {
      ok: false,
      message:
        'Missing EBIRD_API_KEY. Add it to your environment (see .env.local.example).',
    }
  }

  const speciesCode = config.focusSpeciesCode.trim()
  if (!speciesCode) {
    return {
      ok: false,
      message:
        'Focus species code is not set. Configure it in Studio (Pileated Watch → eBird).',
    }
  }

  const max = Math.min(Math.max(1, config.maxObservationsToFetch), 10000)
  const fetchBudget = max
  const back = Math.min(Math.max(1, config.recentDaysBack), 30)
  const collected: BirdObservation[] = []
  const seen = new Set<string>()

  try {
    if (config.mapDataSource === 'hotspots') {
      const codes = parseHotspotCodes(config.hotspotCodes)
      if (codes.length === 0) {
        return {
          ok: false,
          message:
            'No hotspot codes configured. Add L-codes under Hotspot codes in Studio, or switch geographic area to Region.',
        }
      }

      const perHotspot = Math.max(1, Math.ceil(fetchBudget / codes.length))

      for (const hotspotCode of codes) {
        if (collected.length >= fetchBudget) break
        const params = new URLSearchParams()
        params.set('fmt', 'json')
        params.set('detail', 'full')
        params.set('back', String(back))
        params.set(
          'maxResults',
          String(Math.min(perHotspot, fetchBudget - collected.length))
        )

        const path = recentObsPath(hotspotCode, speciesCode)
        const res = await ebirdFetch(path, params, revalidateSeconds)
        if (!res.ok) {
          return {
            ok: false,
            message: `eBird returned ${res.status} for hotspot ${hotspotCode} and species ${speciesCode}. Check codes, species code, and API key.`,
          }
        }
        const json = (await res.json()) as Record<string, unknown>[]
        const rows = Array.isArray(json) ? json : []
        for (const obs of normalizeRecentObs(rows)) {
          if (seen.has(obs.id)) continue
          seen.add(obs.id)
          collected.push(obs)
          if (collected.length >= fetchBudget) break
        }
      }
    } else {
      const region = config.regionCode?.trim()
      if (!region) {
        return {
          ok: false,
          message:
            'Region code is required when geographic area is Region (e.g. US-NY-109).',
        }
      }

      const params = new URLSearchParams()
      params.set('fmt', 'json')
      params.set('detail', 'full')
      params.set('back', String(back))
      params.set('maxResults', String(fetchBudget))

      const path = recentObsPath(region, speciesCode)
      const res = await ebirdFetch(path, params, revalidateSeconds)
      if (!res.ok) {
        return {
          ok: false,
          message: `eBird returned ${res.status} for region ${region} and species ${speciesCode}. Check the region code, species code, and API key.`,
        }
      }
      const json = (await res.json()) as Record<string, unknown>[]
      const rows = Array.isArray(json) ? json : []
      collected.push(...normalizeRecentObs(rows).slice(0, fetchBudget))
    }

    const observations = collected.sort(sortObsDesc).slice(0, max)
    return {ok: true, observations}
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return {ok: false, message}
  }
}

/**
 * Fetches ALL species observations from the configured geographic area — no
 * species filter applied. Used by the Birding Dashboard sync to pull a broad
 * regional picture rather than a single target species.
 *
 * Uses the same geographic config (hotspots / region, daysBack, maxObs) as
 * fetchMapObservations but calls /data/obs/{loc}/recent without a species code.
 */
export async function fetchAllSpeciesObservations(
  config: ResolvedEbirdBirding,
  revalidateSeconds = 300
): Promise<EbirdObservationsResult> {
  const key = getApiKey()
  if (!key) {
    return {
      ok: false,
      message:
        'Missing EBIRD_API_KEY. Add it to your environment (see .env.local.example).',
    }
  }

  const max = Math.min(Math.max(1, config.maxObservationsToFetch), 10000)
  const back = Math.min(Math.max(1, config.recentDaysBack), 30)
  const collected: BirdObservation[] = []
  const seen = new Set<string>()

  try {
    if (config.mapDataSource === 'hotspots') {
      const codes = parseHotspotCodes(config.hotspotCodes)
      if (codes.length === 0) {
        return {
          ok: false,
          message:
            'No hotspot codes configured. Add L-codes under Hotspot codes in Studio, or switch geographic area to Region.',
        }
      }

      const perHotspot = Math.max(1, Math.ceil(max / codes.length))

      for (const hotspotCode of codes) {
        if (collected.length >= max) break
        const params = new URLSearchParams()
        params.set('fmt', 'json')
        params.set('detail', 'full')
        params.set('back', String(back))
        params.set(
          'maxResults',
          String(Math.min(perHotspot, max - collected.length))
        )

        const path = recentAllSpeciesPath(hotspotCode)
        const res = await ebirdFetch(path, params, revalidateSeconds)
        if (!res.ok) {
          return {
            ok: false,
            message: `eBird returned ${res.status} for hotspot ${hotspotCode}. Check the hotspot code and API key.`,
          }
        }
        const json = (await res.json()) as Record<string, unknown>[]
        const rows = Array.isArray(json) ? json : []
        for (const obs of normalizeRecentObs(rows)) {
          if (seen.has(obs.id)) continue
          seen.add(obs.id)
          collected.push(obs)
          if (collected.length >= max) break
        }
      }
    } else {
      const region = config.regionCode?.trim()
      if (!region) {
        return {
          ok: false,
          message:
            'Region code is required when geographic area is Region (e.g. US-NY-109).',
        }
      }

      const params = new URLSearchParams()
      params.set('fmt', 'json')
      params.set('detail', 'full')
      params.set('back', String(back))
      params.set('maxResults', String(max))

      const path = recentAllSpeciesPath(region)
      const res = await ebirdFetch(path, params, revalidateSeconds)
      if (!res.ok) {
        return {
          ok: false,
          message: `eBird returned ${res.status} for region ${region}. Check the region code and API key.`,
        }
      }
      const json = (await res.json()) as Record<string, unknown>[]
      const rows = Array.isArray(json) ? json : []
      collected.push(...normalizeRecentObs(rows).slice(0, max))
    }

    const observations = collected.sort(sortObsDesc).slice(0, max)
    return {ok: true, observations}
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return {ok: false, message}
  }
}
