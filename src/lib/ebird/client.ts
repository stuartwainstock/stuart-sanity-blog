import type {ResolvedEbirdBirding} from '@/lib/ebird/resolveConfig'
import type {
  BirdObservation,
  EbirdFetchError,
  EbirdLifeListResult,
  EbirdObservationsResult,
  LifeListSpecies,
} from '@/lib/ebird/types'

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

function normalizeDisplayName(s: string): string {
  return s.trim().replace(/\s+/g, ' ').toLowerCase()
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

  const max = Math.min(Math.max(1, config.maxObservationsToFetch), 10000)
  const observerFilter = config.mapObserverDisplayNameFilter
  const filterNorm = observerFilter
    ? normalizeDisplayName(observerFilter)
    : ''
  /** Request more rows when filtering so we still have enough after dropping other observers */
  const fetchBudget = filterNorm
    ? Math.min(Math.max(max * 4, max), 10000)
    : max
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
            'No hotspot codes configured. Add L-codes under Hotspot codes in Studio, or switch map source to Region.',
        }
      }

      const perHotspot = Math.max(1, Math.ceil(fetchBudget / codes.length))

      for (const hotspotCode of codes) {
        if (collected.length >= fetchBudget) break
        const params = new URLSearchParams()
        params.set('fmt', 'json')
        params.set('detail', 'full')
        // eBird uses loc ID query param `r` (same as legacy ws1.1 hotspot recent).
        params.set('r', hotspotCode)
        params.set('back', String(back))
        params.set(
          'maxResults',
          String(Math.min(perHotspot, fetchBudget - collected.length))
        )

        const res = await ebirdFetch(
          '/data/obs/hotspot/recent',
          params,
          revalidateSeconds
        )
        if (!res.ok) {
          return {
            ok: false,
            message: `eBird returned ${res.status} for hotspot ${hotspotCode}. Check codes and API key.`,
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
            'Region code is required when map source is Region (e.g. US-NY-109).',
        }
      }

      const params = new URLSearchParams()
      params.set('fmt', 'json')
      params.set('detail', 'full')
      params.set('back', String(back))
      params.set('maxResults', String(fetchBudget))

      const res = await ebirdFetch(
        `/data/obs/${encodeURIComponent(region)}/recent`,
        params,
        revalidateSeconds
      )
      if (!res.ok) {
        return {
          ok: false,
          message: `eBird returned ${res.status} for region ${region}. Check the region code and API key.`,
        }
      }
      const json = (await res.json()) as Record<string, unknown>[]
      const rows = Array.isArray(json) ? json : []
      collected.push(...normalizeRecentObs(rows).slice(0, fetchBudget))
    }

    let observations = collected
    if (filterNorm) {
      observations = observations.filter((obs) => {
        const o = obs.observerDisplayName
        if (!o) return false
        return normalizeDisplayName(o) === filterNorm
      })
    }

    observations.sort(sortObsDesc)
    return {ok: true, observations: observations.slice(0, max)}
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return {ok: false, message}
  }
}

type TaxonomyRow = {
  speciesCode?: string
  comName?: string
  sciName?: string
}

async function fetchTaxonomyRows(): Promise<TaxonomyRow[]> {
  const key = getApiKey()
  if (!key) return []
  const params = new URLSearchParams()
  params.set('fmt', 'json')
  const res = await fetch(`${EBIRD_BASE}/ref/taxonomy/ebird?${params}`, {
    headers: ebirdHeaders(),
    next: {revalidate: 86400},
  })
  if (!res.ok) return []
  const json = (await res.json()) as unknown
  return Array.isArray(json) ? (json as TaxonomyRow[]) : []
}

async function taxonomyCodeMap(): Promise<Map<string, TaxonomyRow>> {
  const rows = await fetchTaxonomyRows()
  const map = new Map<string, TaxonomyRow>()
  for (const row of rows) {
    const c = row.speciesCode?.toLowerCase()
    if (c) map.set(c, row)
  }
  return map
}

function utcYmd(d: Date): {y: string; m: string; day: string} {
  const y = String(d.getUTCFullYear())
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return {y, m, day}
}

/** Calendar days ending today (UTC), length `count` (including today). */
function recentUtcDates(count: number): Date[] {
  const out: Date[] = []
  const end = new Date()
  const endDay = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())
  )
  for (let i = 0; i < count; i++) {
    const d = new Date(endDay)
    d.setUTCDate(d.getUTCDate() - i)
    out.push(d)
  }
  return out
}

const HISTORIC_FETCH_REVALIDATE_SEC = 86400
const HISTORIC_DAY_CONCURRENCY = 12

async function fetchHistoricObservationsForDay(
  loc: string,
  d: Date,
  pageRevalidateSeconds: number
): Promise<Record<string, unknown>[]> {
  const {y, m, day} = utcYmd(d)
  const path = `/data/obs/${encodeURIComponent(loc)}/historic/${y}/${m}/${day}`
  const params = new URLSearchParams()
  params.set('fmt', 'json')
  params.set('detail', 'full')
  params.set('maxResults', '10000')
  try {
    const res = await ebirdFetch(path, params, pageRevalidateSeconds, {
      revalidateOverride: HISTORIC_FETCH_REVALIDATE_SEC,
    })
    if (!res.ok) return []
    const json = (await res.json()) as unknown
    return Array.isArray(json) ? (json as Record<string, unknown>[]) : []
  } catch {
    return []
  }
}

async function fetchPersonalLifeListSpecies(
  config: ResolvedEbirdBirding,
  revalidateSeconds: number
): Promise<EbirdLifeListResult> {
  const filterNorm = normalizeDisplayName(config.lifeListObserverDisplayName)
  if (!filterNorm) {
    return {
      ok: false,
      message:
        'Personal life list needs your eBird display name. Set it under Life list (personal mode) or Map: only this observer, then publish.',
    }
  }

  const loc = config.lifeListLocationId.trim()
  const days = recentUtcDates(config.lifeListHistoricDaysBack)
  const codeSet = new Set<string>()

  for (let i = 0; i < days.length; i += HISTORIC_DAY_CONCURRENCY) {
    const chunk = days.slice(i, i + HISTORIC_DAY_CONCURRENCY)
    const batches = await Promise.all(
      chunk.map((d) => fetchHistoricObservationsForDay(loc, d, revalidateSeconds))
    )
    for (const rows of batches) {
      for (const o of rows) {
        const observer = pickObserverDisplayName(o)
        if (!observer || normalizeDisplayName(observer) !== filterNorm) continue
        const code = typeof o.speciesCode === 'string' ? o.speciesCode.trim() : ''
        if (code) codeSet.add(code)
      }
    }
  }

  const taxMap = await taxonomyCodeMap()
  const codes = [...codeSet].sort((a, b) => a.localeCompare(b))

  const species: LifeListSpecies[] = codes.map((code) => {
    const row = taxMap.get(code.toLowerCase())
    const sci = row?.sciName || code
    const com = row?.comName || null
    return {
      speciesCode: code,
      name: sci,
      commonName: com,
      observationCount: null,
    }
  })

  species.sort((a, b) =>
    (a.commonName || a.name).localeCompare(b.commonName || b.name)
  )

  return {
    ok: true,
    species,
    source: 'personal',
    historicDaysBack: config.lifeListHistoricDaysBack,
  }
}

export async function fetchLifeListSpecies(
  config: ResolvedEbirdBirding,
  revalidateSeconds = 300
): Promise<EbirdLifeListResult> {
  const key = getApiKey()
  if (!key) {
    return {
      ok: false,
      message:
        'Missing EBIRD_API_KEY. Add it to your environment (see .env.local.example).',
    }
  }

  const loc = config.lifeListLocationId?.trim()
  if (!loc) {
    return {
      ok: false,
      message:
        'Life list location is not set. Configure “Life list: region or hotspot ID” in Studio.',
    }
  }

  if (config.lifeListSource === 'personal') {
    try {
      return await fetchPersonalLifeListSpecies(config, revalidateSeconds)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error'
      return {ok: false, message}
    }
  }

  try {
    const params = new URLSearchParams()
    params.set('fmt', 'json')
    const path = `/product/spplist/${encodeURIComponent(loc)}`
    const res = await ebirdFetch(path, params, revalidateSeconds)

    if (!res.ok) {
      return {
        ok: false,
        message: `eBird returned ${res.status} for species list at “${loc}”. Check the location ID and API key.`,
      }
    }

    const json = (await res.json()) as unknown
    const codes: string[] = Array.isArray(json)
      ? json.filter((x): x is string => typeof x === 'string')
      : []

    const taxMap = await taxonomyCodeMap()

    const species: LifeListSpecies[] = codes
      .map((code) => {
        const row = taxMap.get(code.toLowerCase())
        const sci = row?.sciName || code
        const com = row?.comName || null
        return {
          speciesCode: code,
          name: sci,
          commonName: com,
          observationCount: null,
        }
      })
      .sort((a, b) =>
        (a.commonName || a.name).localeCompare(b.commonName || b.name)
      )

    return {ok: true, species, source: 'location'}
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return {ok: false, message}
  }
}
