import 'server-only'

import {cache} from 'react'
import {OurAirports} from 'ourairports-data-js'
import type {AirportCoords, FlightLeg} from '@/lib/travel/types'
import {tripitGetJson} from './client'
import type {TripItAirObject, TripItListAirResponse} from './types'

function arr<T>(v: T | T[] | undefined): T[] {
  if (!v) return []
  return Array.isArray(v) ? v : [v]
}

const getAirportsDb = cache(async () => {
  const db = new OurAirports()
  await db.init()
  return db
})

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

export const fetchTripItFlights = cache(async (): Promise<{
  legs: FlightLeg[]
  airports: AirportCoords
}> => {
  // All air objects where the authenticated user is a traveler, including past flights.
  const data = await tripitGetJson<TripItListAirResponse>(
    '/v1/list/object/type/air/traveler/true/past/true/format/json',
  )

  const airObjects = arr(data.AirObject)
  const legs = toLegs(airObjects)

  const uniqueCodes = new Set<string>()
  for (const l of legs) {
    uniqueCodes.add(l.origin)
    uniqueCodes.add(l.destination)
  }

  const db = await getAirportsDb()
  const airports: AirportCoords = {}
  for (const code of uniqueCodes) {
    const a = db.findByIataCode(code)
    if (!a) continue
    // ourairports-data-js uses {latitude, longitude}
    const lat = (a as unknown as {latitude?: number}).latitude
    const lng = (a as unknown as {longitude?: number}).longitude
    if (typeof lat === 'number' && typeof lng === 'number') {
      airports[code] = {lat, lng}
    }
  }

  return {legs, airports}
})

