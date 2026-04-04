import type {ResolvedInaturalistBackyard} from '@/lib/inaturalist/resolveConfig'
import type {
  BackyardObservation,
  InatLifeListResult,
  InatObservationsResult,
  LifeListSpecies,
} from './types'

const INAT_BASE = 'https://api.inaturalist.org/v1'
const PER_PAGE = 200

/** Identify the app per https://www.inaturalist.org/pages/api+recommended+practices */
const INAT_USER_AGENT =
  'BackyardBirdsSite/1.0 (Next.js; personal nature journal; https://www.inaturalist.org/pages/api+recommended+practices)'

function inatFetch(url: string, revalidateSeconds: number) {
  return fetch(url, {
    headers: {'User-Agent': INAT_USER_AGENT, Accept: 'application/json'},
    next: {revalidate: revalidateSeconds},
  })
}

function buildBaseParams(config: ResolvedInaturalistBackyard): URLSearchParams {
  const p = new URLSearchParams()
  p.set('user_login', config.inatUserLogin.trim())
  p.set('iconic_taxa_name', (config.iconicTaxaName || 'Aves').trim())
  if (config.placeId != null && !Number.isNaN(config.placeId)) {
    p.set('place_id', String(config.placeId))
  }
  const box = config.boundingBox
  if (
    box?.nelat != null &&
    box.nelng != null &&
    box.swlat != null &&
    box.swlng != null
  ) {
    p.set('nelat', String(box.nelat))
    p.set('nelng', String(box.nelng))
    p.set('swlat', String(box.swlat))
    p.set('swlng', String(box.swlng))
  }
  return p
}

function photoFromObservation(o: Record<string, unknown>): {
  url: string | null
  alt: string | null
} {
  const photos = o.photos as Array<Record<string, unknown>> | undefined
  const first = photos?.[0]
  if (!first) return {url: null, alt: null}
  const url = (first.url as string | undefined) || null
  const medium =
    typeof url === 'string' ? url.replace('/square.', '/medium.') : null
  const taxon = o.taxon as Record<string, unknown> | undefined
  const name = (taxon?.name as string) || 'Observation'
  return {url: medium, alt: `Photo for ${name}`}
}

function normalizeObservation(o: Record<string, unknown>): BackyardObservation | null {
  const id = o.id as number | undefined
  const geojson = o.geojson as {coordinates?: [number, number]} | undefined
  const coords = geojson?.coordinates
  const taxon = o.taxon as Record<string, unknown> | undefined
  const taxonId = taxon?.id as number | undefined
  const speciesName =
    (taxon?.preferred_common_name as string) ||
    (taxon?.name as string) ||
    'Unknown'

  if (
    id == null ||
    coords == null ||
    coords.length < 2 ||
    taxonId == null
  ) {
    return null
  }

  const [lng, lat] = coords
  const observedOn =
    (o.observed_on as string | undefined) ||
    (o.time_observed_at as string | undefined) ||
    null

  const {url: photoUrl, alt: photoAlt} = photoFromObservation(o)

  return {
    id,
    observedOn,
    latitude: lat,
    longitude: lng,
    speciesName,
    taxonId,
    uri: `https://www.inaturalist.org/observations/${id}`,
    photoUrl,
    photoAlt,
  }
}

export async function fetchBackyardObservations(
  config: ResolvedInaturalistBackyard,
  revalidateSeconds = 300
): Promise<InatObservationsResult> {
  const max = Math.min(
    Math.max(1, config.maxObservationsToFetch || 500),
    5000
  )

  const collected: BackyardObservation[] = []
  let page = 1

  try {
    while (collected.length < max) {
      const params = buildBaseParams(config)
      params.set('per_page', String(PER_PAGE))
      params.set('page', String(page))
      params.set('order', 'desc')
      params.set('order_by', 'created_at')

      const url = `${INAT_BASE}/observations?${params.toString()}`
      const res = await inatFetch(url, revalidateSeconds)

      if (!res.ok) {
        return {
          ok: false,
          message: `iNaturalist returned ${res.status}. Try again later.`,
        }
      }

      const json = (await res.json()) as {results?: Record<string, unknown>[]}
      const results = json.results || []
      for (const raw of results) {
        const n = normalizeObservation(raw)
        if (n) collected.push(n)
        if (collected.length >= max) break
      }

      if (results.length < PER_PAGE) break
      page += 1
    }

    return {ok: true, observations: collected}
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return {ok: false, message}
  }
}

export async function fetchLifeListSpecies(
  config: ResolvedInaturalistBackyard,
  revalidateSeconds = 300
): Promise<InatLifeListResult> {
  try {
    const params = buildBaseParams(config)
    const url = `${INAT_BASE}/observations/species_counts?${params.toString()}`
    const res = await inatFetch(url, revalidateSeconds)

    if (!res.ok) {
      return {
        ok: false,
        message: `iNaturalist returned ${res.status}. Try again later.`,
      }
    }

    const json = (await res.json()) as {
      results?: Array<{
        count?: number
        taxon?: Record<string, unknown>
      }>
    }

    const species: LifeListSpecies[] = (json.results || [])
      .map((row) => {
        const taxon = row.taxon || {}
        const taxonId = taxon.id as number | undefined
        if (taxonId == null) return null
        const name = (taxon.name as string) || 'Unknown'
        const commonName =
          (taxon.preferred_common_name as string | null) || null
        const wikiUrl = (taxon.wikipedia_url as string | null) || null
        const photo = taxon.default_photo as Record<string, unknown> | undefined
        const mediumUrl = (photo?.medium_url as string | null) || null
        const squareUrl = (photo?.square_url as string | null) || null
        const defaultPhotoUrl = mediumUrl || squareUrl

        return {
          taxonId,
          name,
          commonName,
          observationCount: row.count ?? 0,
          wikiUrl,
          defaultPhotoUrl,
        }
      })
      .filter((x): x is LifeListSpecies => x != null)
      .sort((a, b) =>
        (a.commonName || a.name).localeCompare(b.commonName || b.name)
      )

    return {ok: true, species}
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return {ok: false, message}
  }
}
