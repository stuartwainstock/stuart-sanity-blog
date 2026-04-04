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
  lifeListSource: 'location' | 'personal'
  /** Personal mode: calendar days to scan (historic API) */
  lifeListHistoricDaysBack: number
  /** Trimmed; empty means no observer filter */
  mapObserverDisplayNameFilter: string
  /**
   * Personal life list: observer display name (dedicated field or map filter).
   * Empty when not used.
   */
  lifeListObserverDisplayName: string
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
    lifeListSource: raw.lifeListSource === 'personal' ? 'personal' : 'location',
    lifeListHistoricDaysBack: Math.min(
      Math.max(1, raw.lifeListHistoricDaysBack ?? 180),
      366
    ),
    mapObserverDisplayNameFilter: raw.mapObserverDisplayNameFilter?.trim() || '',
    lifeListObserverDisplayName: (() => {
      const own = raw.lifeListObserverDisplayName?.trim()
      if (own) return own
      return raw.mapObserverDisplayNameFilter?.trim() || ''
    })(),
  }
}
