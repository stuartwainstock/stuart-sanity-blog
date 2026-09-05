import 'server-only'

import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {cache} from 'react'
import {resolveAirportCoordsForIataCodes} from '@/lib/travel/airportCoordsNode'
import type {AirportCoords, FlightLeg} from '@/lib/travel/types'
import tripItHistoricalJson from '@/data/tripit/list-air-historical.json'
import {tripitGetJson} from './client'
import type {TripItAirObject, TripItListAirResponse} from './types'

function arr<T>(v: T | T[] | undefined): T[] {
  if (!v) return []
  return Array.isArray(v) ? v : [v]
}

function toLegs(objects: TripItAirObject[]): FlightLeg[] {
  const legs: FlightLeg[] = []
  for (const obj of objects) {
    const segments = arr(obj.Segment)
    for (const seg of segments) {
      const origin = seg.start_airport_code?.trim()
      const destination = seg.end_airport_code?.trim()
      const date = seg.StartDateTime?.date?.trim()
      if (!origin || !destination || !date) continue
      legs.push({
        id: `${obj.id ?? 'air'}-${origin}-${destination}-${date}`,
        date,
        origin,
        destination,
      })
    }
  }
  return legs
}

/**
 * Resolve airport coordinates for legs (IATA → lat/lng via ourairports JSON shards).
 * Same pipeline for live API and historical JSON exports.
 */
async function legsToFlightMap(legs: FlightLeg[]): Promise<{
  legs: FlightLeg[]
  airports: AirportCoords
}> {
  const uniqueCodes = new Set<string>()
  for (const l of legs) {
    uniqueCodes.add(l.origin)
    uniqueCodes.add(l.destination)
  }

  const airports = await resolveAirportCoordsForIataCodes(uniqueCodes)
  return {legs, airports}
}

async function loadTripItJsonFromPath(relativeOrAbsolute: string): Promise<TripItListAirResponse> {
  const p = String(relativeOrAbsolute).trim()
  const resolved = path.isAbsolute(p) ? p : path.join(process.cwd(), p)
  const raw = await readFile(resolved, 'utf8')
  return JSON.parse(raw) as TripItListAirResponse
}

/**
 * TripIt list-air JSON (same shape as `GET .../format/json` from the API).
 * Set `TRIPIT_FLIGHTS_JSON` to a path (repo-relative or absolute) to override the
 * committed export. Prefer the static import in production — `existsSync` + cwd
 * is unreliable under Turbopack/Vercel (file never lands in the serverless bundle).
 */
export async function tripItListAirResponseToFlightMap(
  data: TripItListAirResponse,
): Promise<{legs: FlightLeg[]; airports: AirportCoords}> {
  const airObjects = arr(data.AirObject)
  const legs = toLegs(airObjects)
  return legsToFlightMap(legs)
}

export const fetchTripItFlights = cache(async (): Promise<{
  legs: FlightLeg[]
  airports: AirportCoords
}> => {
  const envPath = process.env.TRIPIT_FLIGHTS_JSON?.trim()
  if (envPath) {
    const data = await loadTripItJsonFromPath(envPath)
    return tripItListAirResponseToFlightMap(data)
  }

  // Prefer the committed export (bundled via static import).
  const bundled = tripItHistoricalJson as TripItListAirResponse
  if (Array.isArray(bundled.AirObject) || bundled.AirObject) {
    return tripItListAirResponseToFlightMap(bundled)
  }

  // Dev-only fallback: live TripIt OAuth when no export is available.
  const data = await tripitGetJson<TripItListAirResponse>(
    '/v1/list/object/type/air/traveler/true/past/true/format/json',
  )

  return tripItListAirResponseToFlightMap(data)
})
