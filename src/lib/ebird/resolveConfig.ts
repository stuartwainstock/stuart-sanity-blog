import type {EbirdBirding} from '@/lib/types'

const MAP_FALLBACK = {
  latitude: 39.8283,
  longitude: -98.5795,
  zoom: 4,
}

export type ResolvedEbirdBirding = EbirdBirding & {
  recentDaysBack: number
  maxObservationsToFetch: number
  defaultMapLatitude: number
  defaultMapLongitude: number
  defaultMapZoom: number
  lifeListLocationId: string
  /** Trimmed; empty means no observer filter */
  mapObserverDisplayNameFilter: string
}

export function resolveEbirdBirding(
  raw: EbirdBirding | null
): ResolvedEbirdBirding | null {
  if (!raw) return null
  return {
    ...raw,
    mapDataSource: raw.mapDataSource || 'hotspots',
    recentDaysBack: raw.recentDaysBack ?? 30,
    maxObservationsToFetch: raw.maxObservationsToFetch ?? 500,
    defaultMapLatitude: raw.defaultMapLatitude ?? MAP_FALLBACK.latitude,
    defaultMapLongitude: raw.defaultMapLongitude ?? MAP_FALLBACK.longitude,
    defaultMapZoom: raw.defaultMapZoom ?? MAP_FALLBACK.zoom,
    lifeListLocationId: raw.lifeListLocationId?.trim() || '',
    mapObserverDisplayNameFilter: raw.mapObserverDisplayNameFilter?.trim() || '',
  }
}
