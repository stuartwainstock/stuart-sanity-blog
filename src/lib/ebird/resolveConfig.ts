import type {EbirdBirding} from '@/lib/types'

const MAP_FALLBACK = {
  latitude: 39.8283,
  longitude: -98.5795,
  zoom: 4,
}

const DEFAULT_SPECIES_CODE = 'pilwoo'
const DEFAULT_SPECIES_LABEL = 'Pileated Woodpecker'

export type EbirdAreaConfig = {
  mapDataSource: 'hotspots' | 'region'
  hotspotCodes?: string
  regionCode?: string
  recentDaysBack: number
  maxObservationsToFetch: number
}

export type ResolvedEbirdBirding = EbirdBirding & {
  recentDaysBack: number
  maxObservationsToFetch: number
  defaultMapLatitude: number
  defaultMapLongitude: number
  defaultMapZoom: number
  focusSpeciesCode: string
  focusSpeciesCommonName: string
  mapSectionTitle: string
  sightingsSectionTitle: string
}

export type ResolvedEbirdDashboard = EbirdAreaConfig & {
  recentDaysBack: number
  maxObservationsToFetch: number
}

function resolveAreaConfig(
  raw: Pick<EbirdAreaConfig, 'mapDataSource' | 'hotspotCodes' | 'regionCode' | 'recentDaysBack' | 'maxObservationsToFetch'>
): EbirdAreaConfig {
  return {
    mapDataSource: raw.mapDataSource || 'hotspots',
    hotspotCodes: raw.hotspotCodes,
    regionCode: raw.regionCode,
    recentDaysBack: raw.recentDaysBack ?? 30,
    maxObservationsToFetch: raw.maxObservationsToFetch ?? 500,
  }
}

export function resolveEbirdBirding(
  raw: EbirdBirding | null
): ResolvedEbirdBirding | null {
  if (!raw) return null
  const code = raw.focusSpeciesCode?.trim() || DEFAULT_SPECIES_CODE
  return {
    ...raw,
    ...resolveAreaConfig(raw),
    defaultMapLatitude: raw.defaultMapLatitude ?? MAP_FALLBACK.latitude,
    defaultMapLongitude: raw.defaultMapLongitude ?? MAP_FALLBACK.longitude,
    defaultMapZoom: raw.defaultMapZoom ?? MAP_FALLBACK.zoom,
    focusSpeciesCode: code,
    focusSpeciesCommonName:
      raw.focusSpeciesCommonName?.trim() || DEFAULT_SPECIES_LABEL,
    mapSectionTitle: raw.mapSectionTitle?.trim() || 'Map',
    sightingsSectionTitle: raw.sightingsSectionTitle?.trim() || 'Sightings',
  }
}

export function resolveEbirdDashboard(raw: EbirdAreaConfig | null): ResolvedEbirdDashboard | null {
  if (!raw) return null
  return resolveAreaConfig(raw)
}
