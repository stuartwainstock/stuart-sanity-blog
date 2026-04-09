export type TripItDateTime = {
  date?: string
  time?: string
  timezone?: string
  utc_offset?: string
}

export type TripItAirSegment = {
  StartDateTime?: TripItDateTime
  EndDateTime?: TripItDateTime
  start_airport_code?: string
  end_airport_code?: string
  start_city_name?: string
  end_city_name?: string
  marketing_airline?: string
  marketing_airline_code?: string
  marketing_flight_number?: string
}

export type TripItAirObject = {
  id?: string
  trip_id?: string
  is_traveler?: string | boolean
  display_name?: string
  Segment?: TripItAirSegment | TripItAirSegment[]
}

export type TripItListAirResponse = {
  timestamp?: string
  num_bytes?: string
  AirObject?: TripItAirObject | TripItAirObject[]
}

