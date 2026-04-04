/**
 * Normalized shapes for the app (decoupled from raw eBird JSON).
 */

export interface BirdObservation {
  /** Stable key for React lists */
  id: string
  observedOn: string | null
  latitude: number
  longitude: number
  speciesName: string
  speciesCode: string
  checklistUri: string
  locationLabel: string | null
  /** Present when API returns detail=full (used for observer filter) */
  observerDisplayName: string | null
}

export interface LifeListSpecies {
  speciesCode: string
  name: string
  commonName: string | null
  /** eBird spplist does not include per-species counts; null in that path */
  observationCount: number | null
}

export interface EbirdFetchError {
  ok: false
  message: string
}

export type EbirdObservationsResult =
  | {ok: true; observations: BirdObservation[]}
  | EbirdFetchError

export type EbirdLifeListResult =
  | {
      ok: true
      species: LifeListSpecies[]
      source: 'location' | 'personal'
      /** Personal mode: window length in days */
      historicDaysBack?: number
    }
  | EbirdFetchError
