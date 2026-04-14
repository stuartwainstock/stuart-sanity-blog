'use client'

import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react'
import Map, {Layer, NavigationControl, Source, type MapRef} from 'react-map-gl/maplibre'
import {LngLatBounds} from 'maplibre-gl'
import type {Feature, FeatureCollection} from 'geojson'
import {maplibregl} from '@/lib/maplibreClient'
import {SITE_MAP_STYLE} from '@/lib/maps/cartoStyle'
import {readCssVarColor} from '@/lib/tokens/readCssVarColor'
import {greatCircleSegmentsGeoJson, haversineKm} from '@/lib/travel/greatCircle'
import type {AirportCoords, FlightLeg} from '@/lib/travel/types'
import colorSource from '../../../tokens/color.json'

const FLIGHT_LINE_LAYER_ID = 'flight-paths-lines'

const LINK_COLOR_FALLBACK = (
  colorSource as {color: {link: {'$value': string}}}
).color.link['$value']

function formatDisplayDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00Z`)
  if (Number.isNaN(d.getTime())) return isoDate
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(d)
}

function buildFlightGeoJson(
  flights: FlightLeg[],
  airports: AirportCoords,
  palette: string[],
): FeatureCollection {
  const features: FeatureCollection['features'] = []

  flights.forEach((flight, index) => {
    const o = airports[flight.origin]
    const d = airports[flight.destination]
    if (!o || !d) {
      if (typeof window !== 'undefined') {
        console.warn(
          `[FlightPathMap] Missing airport coords for ${flight.origin} or ${flight.destination} (flight ${flight.id})`,
        )
      }
      return
    }
    if (flight.origin === flight.destination) return

    const distanceKm = haversineKm(o.lat, o.lng, d.lat, d.lng)
    const segments = greatCircleSegmentsGeoJson(o, d, 72)
    const color = palette[index % palette.length]!

    segments.forEach((coordinates, segIdx) => {
      if (coordinates.length < 2) return
      features.push({
        type: 'Feature',
        id: `${flight.id}-${segIdx}`,
        properties: {
          id: flight.id,
          date: flight.date,
          origin: flight.origin,
          destination: flight.destination,
          distanceKm,
          color,
          dateLabel: formatDisplayDate(flight.date),
        },
        geometry: {
          type: 'LineString',
          coordinates,
        },
      })
    })
  })

  return {
    type: 'FeatureCollection',
    features,
  }
}

function propsFromFeature(
  feat: Feature | maplibregl.MapGeoJSONFeature | undefined,
): {
  dateLabel: string
  origin: string
  destination: string
  distanceKm: number
} | null {
  if (!feat?.properties || typeof feat.properties !== 'object') return null
  const p = feat.properties as Record<string, unknown>
  const dateLabel = typeof p.dateLabel === 'string' ? p.dateLabel : undefined
  const origin = typeof p.origin === 'string' ? p.origin : undefined
  const destination = typeof p.destination === 'string' ? p.destination : undefined
  const distanceKm =
    typeof p.distanceKm === 'number'
      ? p.distanceKm
      : typeof p.distanceKm === 'string'
        ? Number.parseFloat(p.distanceKm)
        : NaN
  if (!dateLabel || !origin || !destination || !Number.isFinite(distanceKm)) return null
  return {dateLabel, origin, destination, distanceKm}
}

/** Fit to airport endpoints only — line vertices may use lng outside ±180° after antimeridian unwrap. */
function fitMapToRouteEndpoints(
  map: maplibregl.Map,
  flights: FlightLeg[],
  airports: AirportCoords,
) {
  const bounds = new LngLatBounds()
  for (const flight of flights) {
    const o = airports[flight.origin]
    const d = airports[flight.destination]
    if (o && flight.origin !== flight.destination) bounds.extend([o.lng, o.lat])
    if (d && flight.origin !== flight.destination) bounds.extend([d.lng, d.lat])
  }
  try {
    map.fitBounds(bounds, {padding: 56, maxZoom: 7, duration: 0})
  } catch {
    /* invalid bounds if no coordinates */
  }
}

export type FlightPathMapProps = {
  flights: FlightLeg[]
  airports: AirportCoords
  className?: string
  /**
   * Optional palette (cycled by flight order). If omitted, routes use the `color.link` token
   * (`--color-link`), resolved for MapLibre since line paint cannot use CSS `var()`.
   */
  lineColors?: string[]
}

export default function FlightPathMap({
  flights,
  airports,
  className,
  lineColors,
}: FlightPathMapProps) {
  const mapRef = useRef<MapRef>(null)
  const [mapReady, setMapReady] = useState(false)
  const [linkLineColor, setLinkLineColor] = useState(LINK_COLOR_FALLBACK)
  const [hover, setHover] = useState<null | {
    x: number
    y: number
    dateLabel: string
    route: string
    distance: string
  }>(null)

  useLayoutEffect(() => {
    setLinkLineColor(readCssVarColor('--color-link', LINK_COLOR_FALLBACK))
  }, [])

  const palette = useMemo(() => {
    if (lineColors && lineColors.length > 0) return lineColors
    return [linkLineColor]
  }, [lineColors, linkLineColor])

  const geojson = useMemo(
    () => buildFlightGeoJson(flights, airports, palette),
    [flights, airports, palette],
  )
  const hasRoutes = geojson.features.length > 0

  const fitToFlights = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map || !hasRoutes) return
    fitMapToRouteEndpoints(map, flights, airports)
  }, [airports, flights, hasRoutes])

  useEffect(() => {
    if (!mapReady) return
    fitToFlights()
  }, [mapReady, fitToFlights])

  const setCursor = useCallback((cursor: string) => {
    const canvas = mapRef.current?.getMap()?.getCanvas()
    if (canvas) canvas.style.cursor = cursor
  }, [])

  const onMapMouseMove = useCallback(
    (e: {point: {x: number; y: number}; features?: maplibregl.MapGeoJSONFeature[] | null}) => {
      const f = e.features?.[0]
      const p = propsFromFeature(f)
      if (!p) {
        setHover(null)
        setCursor('')
        return
      }
      setCursor('pointer')
      const km = Math.round(p.distanceKm)
      const mi = Math.round(p.distanceKm * 0.621371)
      setHover({
        x: e.point.x,
        y: e.point.y,
        dateLabel: p.dateLabel,
        route: `${p.origin} → ${p.destination}`,
        distance: `${km.toLocaleString()} km (${mi.toLocaleString()} mi)`,
      })
    },
    [setCursor],
  )

  const onMapMouseLeave = useCallback(() => {
    setHover(null)
    setCursor('')
  }, [setCursor])

  const shellClass =
    className ??
    'w-full h-[min(70vh,560px)] rounded-lg border border-gray-200 overflow-hidden shadow-sm bg-gray-100'

  return (
    <div className={shellClass}>
      {!hasRoutes ? (
        <div className="flex h-full min-h-[320px] items-center justify-center px-4 text-center text-gray-600 text-sm">
          No flight legs to render. Add airport coordinates for each IATA code in your data source.
        </div>
      ) : (
        <div
          className="relative h-full w-full min-h-[320px]"
          role="region"
          aria-label="Map of great-circle flight paths"
        >
          <Map
            ref={mapRef}
            mapLib={maplibregl}
            initialViewState={{
              longitude: 10,
              latitude: 25,
              zoom: 2,
            }}
            style={{width: '100%', height: '100%'}}
            mapStyle={SITE_MAP_STYLE}
            interactiveLayerIds={[FLIGHT_LINE_LAYER_ID]}
            onLoad={() => setMapReady(true)}
            onMouseMove={onMapMouseMove}
            onMouseLeave={onMapMouseLeave}
          >
            <NavigationControl position="top-right" showCompass={false} />
            <Source id="flight-paths" type="geojson" data={geojson}>
              <Layer
                id={FLIGHT_LINE_LAYER_ID}
                type="line"
                paint={{
                  'line-color': ['get', 'color'],
                  'line-width': 3,
                  'line-opacity': 0.92,
                }}
                layout={{
                  'line-cap': 'round',
                  'line-join': 'round',
                }}
              />
            </Source>
          </Map>
          {hover ? (
            <div
              className="pointer-events-none absolute z-10 max-w-xs rounded-md border border-gray-200 bg-white/95 px-3 py-2 text-sm text-gray-900 shadow-md"
              style={{
                left: hover.x,
                top: hover.y,
                transform: 'translate(-50%, calc(-100% - 10px))',
              }}
            >
              <div className="font-semibold">{hover.dateLabel}</div>
              <div>{hover.route}</div>
              <div>{hover.distance}</div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
