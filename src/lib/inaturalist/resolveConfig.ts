import type {InaturalistBackyard} from '@/lib/types'

/** Fallback map view when CMS defaults are empty (continental US). */
const MAP_FALLBACK = {
  latitude: 39.8283,
  longitude: -98.5795,
  zoom: 4,
}

export type ResolvedInaturalistBackyard = InaturalistBackyard & {
  iconicTaxaName: string
  maxObservationsToFetch: number
  defaultMapLatitude: number
  defaultMapLongitude: number
  defaultMapZoom: number
}

/**
 * Fills optional CMS fields so the iNaturalist client and map always receive numbers.
 */
export function resolveInaturalistBackyard(
  raw: InaturalistBackyard | null
): ResolvedInaturalistBackyard | null {
  if (!raw) return null
  return {
    ...raw,
    iconicTaxaName: raw.iconicTaxaName || 'Aves',
    maxObservationsToFetch: raw.maxObservationsToFetch ?? 500,
    defaultMapLatitude: raw.defaultMapLatitude ?? MAP_FALLBACK.latitude,
    defaultMapLongitude: raw.defaultMapLongitude ?? MAP_FALLBACK.longitude,
    defaultMapZoom: raw.defaultMapZoom ?? MAP_FALLBACK.zoom,
  }
}
