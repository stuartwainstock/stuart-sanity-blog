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
  /** Present when API returns detail=full */
  observerDisplayName: string | null
}

export interface EbirdFetchError {
  ok: false
  message: string
}

export type EbirdObservationsResult =
  | {ok: true; observations: BirdObservation[]}
  | EbirdFetchError
