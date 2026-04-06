'use client'

import {useCallback, useEffect, useId, useMemo, useRef, useState} from 'react'
import Map, {Layer, NavigationControl, Source, type MapRef} from 'react-map-gl/maplibre'
import {LngLatBounds} from 'maplibre-gl'
import polyline from '@mapbox/polyline'
import type {FeatureCollection} from 'geojson'
import 'maplibre-gl/dist/maplibre-gl.css'
import {pageBodyParagraph} from '@/lib/pageTypography'
import {
  RUNS_MAP_HOME_BOUNDS,
  RUNS_MAP_HOME_CENTER,
  RUNS_MAP_HOME_ZOOM,
  RUNS_MAP_WINDOW_DAYS,
} from '@/lib/strava/constants'
import type {StravaRunMapInput} from '@/lib/strava/types'

const MAP_STYLE =
  'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

function pointInHomeBounds(lng: number, lat: number): boolean {
  const b = RUNS_MAP_HOME_BOUNDS
  return lat >= b.south && lat <= b.north && lng >= b.west && lng <= b.east
}

/**
 * Bounds for framing: prefer coordinates inside the home (MSP) box when the route touches
 * that region; otherwise use the full route. Avoids zooming out for scattered global runs.
 */
function buildFitBounds(
  features: FeatureCollection['features'],
): LngLatBounds | null {
  const homeBounds = new LngLatBounds()
  let homeHas = false
  const fullBounds = new LngLatBounds()
  let fullHas = false

  for (const f of features) {
    if (f.geometry.type !== 'LineString') continue
    const coords = f.geometry.coordinates
    let routeTouchesHome = false
    for (const c of coords) {
      const lng = c[0]!
      const lat = c[1]!
      fullBounds.extend(c as [number, number])
      fullHas = true
      if (pointInHomeBounds(lng, lat)) routeTouchesHome = true
    }
    if (!routeTouchesHome) continue
    for (const c of coords) {
      const lng = c[0]!
      const lat = c[1]!
      if (pointInHomeBounds(lng, lat)) {
        homeBounds.extend(c as [number, number])
        homeHas = true
      }
    }
  }

  if (homeHas) return homeBounds
  if (fullHas) return fullBounds
  return null
}

type Props = {
  runs: StravaRunMapInput[]
}

function buildGeoJson(runs: StravaRunMapInput[]): FeatureCollection {
  const features: FeatureCollection['features'] = []
  for (const r of runs) {
    if (!r.map_polyline?.trim()) continue
    try {
      const decoded = polyline.decode(r.map_polyline)
      if (decoded.length < 2) continue
      const coordinates = decoded.map(([lat, lng]) => [lng, lat] as [number, number])
      features.push({
        type: 'Feature',
        properties: {
          id: r.id,
          start_date: r.start_date,
        },
        geometry: {
          type: 'LineString',
          coordinates,
        },
      })
    } catch {
      /* skip malformed polyline */
    }
  }
  return {
    type: 'FeatureCollection',
    features,
  }
}

export default function StravaRunsMap({runs}: Props) {
  const mapRef = useRef<MapRef>(null)
  const descriptionId = useId()
  const [mapReady, setMapReady] = useState(false)

  const geojson = useMemo(() => buildGeoJson(runs), [runs])
  const hasRoutes = geojson.features.length > 0

  const fitToRoutes = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map || !hasRoutes) return
    const bounds = buildFitBounds(geojson.features)
    if (!bounds) return
    try {
      map.fitBounds(bounds, {padding: 56, maxZoom: 14, duration: 0})
    } catch {
      map.jumpTo({
        center: [RUNS_MAP_HOME_CENTER.longitude, RUNS_MAP_HOME_CENTER.latitude],
        zoom: RUNS_MAP_HOME_ZOOM,
      })
    }
  }, [geojson.features, hasRoutes])

  useEffect(() => {
    if (!mapReady) return
    fitToRoutes()
  }, [mapReady, fitToRoutes])

  return (
    <div className="space-y-6">
      <p id={descriptionId} className={pageBodyParagraph}>
        Routes from the last {RUNS_MAP_WINDOW_DAYS} days with GPS polylines from Strava. The map defaults to
        the Minneapolis–Saint Paul area when you have runs there; zoom and pan to explore everywhere.
        Lines are your full recorded paths.
      </p>
      {!hasRoutes ? (
        <p className={pageBodyParagraph}>
          No runs with map data in this window. Sync again after activities include GPS, or widen your
          history in Strava.
        </p>
      ) : (
        <div
          id="runs-map"
          className="relative w-full h-[min(70vh,520px)] rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-100"
          role="region"
          aria-label="Map of Strava run routes from the last year"
          aria-describedby={descriptionId}
        >
          <Map
            ref={mapRef}
            initialViewState={{
              ...RUNS_MAP_HOME_CENTER,
              zoom: RUNS_MAP_HOME_ZOOM,
            }}
            style={{width: '100%', height: '100%'}}
            mapStyle={MAP_STYLE}
            onLoad={() => setMapReady(true)}
          >
            <NavigationControl position="top-right" showCompass={false} />
            <Source id="strava-runs" type="geojson" data={geojson}>
              <Layer
                id="strava-runs-lines"
                type="line"
                paint={{
                  'line-color': '#1f2937',
                  'line-width': 2,
                  'line-opacity': 0.88,
                }}
                layout={{
                  'line-cap': 'round',
                  'line-join': 'round',
                }}
              />
            </Source>
          </Map>
        </div>
      )}
    </div>
  )
}
