/** One flight segment (TripIt-style: origin/destination airport codes). */
export type FlightLeg = {
  id: string
  /** ISO date string (YYYY-MM-DD) for display */
  date: string
  origin: string
  destination: string
}

export type AirportCoords = Record<string, {lat: number; lng: number}>
