/**
 * Normalized shapes used by the Next.js app. Decoupled from iNaturalist JSON.
 */

export interface BackyardObservation {
  id: number
  observedOn: string | null
  latitude: number
  longitude: number
  speciesName: string
  taxonId: number
  uri: string
  photoUrl: string | null
  photoAlt: string | null
}

export interface LifeListSpecies {
  taxonId: number
  name: string
  commonName: string | null
  observationCount: number
  wikiUrl: string | null
  defaultPhotoUrl: string | null
}

export interface InatFetchError {
  ok: false
  message: string
}

export type InatObservationsResult =
  | {ok: true; observations: BackyardObservation[]}
  | InatFetchError

export type InatLifeListResult =
  | {ok: true; species: LifeListSpecies[]}
  | InatFetchError
