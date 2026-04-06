/**
 * OpenStreetMap Nominatim reverse geocoding (city / metro–level labels).
 * @see https://operations.osmfoundation.org/policies/nominatim/
 *
 * Use a descriptive User-Agent; cache responses via Next fetch to avoid hammering the public API.
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/reverse'

function nominatimUserAgent(): string {
  const contact =
    process.env.NOMINATIM_CONTACT_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    'https://github.com/stuartwainstock/stuart-sanity-blog'
  return `sanity-blog/1.0 (${contact})`
}

/** Round for deduplication: ~1.1 km — same metro area usually shares one bucket. */
export function coordBucketKey(lat: number, lng: number, decimals = 2): string {
  return `${lat.toFixed(decimals)}_${lng.toFixed(decimals)}`
}

export function formatPlaceLabelFromNominatimAddress(
  addr: Record<string, string | undefined> | null | undefined,
): string | null {
  if (!addr) return null
  const place =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.municipality ||
    addr.city_district ||
    addr.suburb ||
    addr.hamlet ||
    addr.county
  if (!place) return null
  const country = addr.country
  if (country && country !== place) return `${place}, ${country}`
  return place
}

type NominatimReverseJson = {
  address?: Record<string, string>
  error?: string
}

/**
 * Reverse geocode to a human place name (city + country when available).
 * Cached for 7 days via Next.js fetch cache to limit repeat requests.
 */
export async function reverseGeocodePlaceLabel(lat: number, lng: number): Promise<string | null> {
  const url = new URL(NOMINATIM_BASE)
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lng))
  url.searchParams.set('format', 'json')
  url.searchParams.set('addressdetails', '1')
  /** City / town level; avoids overly precise neighbourhood-only results when possible. */
  url.searchParams.set('zoom', '10')

  const res = await fetch(url.toString(), {
    headers: {
      'User-Agent': nominatimUserAgent(),
      Accept: 'application/json',
    },
    next: {revalidate: 60 * 60 * 24 * 7},
  })

  if (!res.ok) return null

  const data = (await res.json()) as NominatimReverseJson
  if (data.error || !data.address) return null
  return formatPlaceLabelFromNominatimAddress(data.address)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Milliseconds between Nominatim calls when resolving multiple unique buckets (usage policy). */
export const NOMINATIM_REQUEST_GAP_MS = 1100

/** Cap unique reverse lookups per page render to keep TTFB reasonable. */
export const MAX_UNIQUE_REVERSE_GEOCODE = 15
