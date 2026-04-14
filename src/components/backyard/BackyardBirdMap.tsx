'use client'

import {useCallback, useEffect, useId, useRef, useState} from 'react'
import Map, {Marker, NavigationControl, type MapRef} from 'react-map-gl/maplibre'
import {LngLatBounds} from 'maplibre-gl'
import {maplibregl} from '@/lib/maplibreClient'
import {SITE_MAP_STYLE} from '@/lib/maps/cartoStyle'
import type {BirdObservation} from '@/lib/ebird/types'
import {pageBodyParagraph} from '@/lib/pageTypography'
import styles from './BackyardBirdMap.module.css'

type Props = {
  observations: BirdObservation[]
  defaultLatitude: number
  defaultLongitude: number
  defaultZoom: number
  focusSpeciesLabel: string
}

export default function BackyardBirdMap({
  observations,
  defaultLatitude,
  defaultLongitude,
  defaultZoom,
  focusSpeciesLabel,
}: Props) {
  const mapRef = useRef<MapRef>(null)
  const descriptionId = useId()
  const [mapReady, setMapReady] = useState(false)

  const fitToObservations = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map || observations.length === 0) return
    const bounds = new LngLatBounds()
    for (const o of observations) {
      bounds.extend([o.longitude, o.latitude])
    }
    try {
      map.fitBounds(bounds, {padding: 56, maxZoom: 16, duration: 0})
    } catch {
      map.jumpTo({
        center: [defaultLongitude, defaultLatitude],
        zoom: defaultZoom,
      })
    }
  }, [observations, defaultLatitude, defaultLongitude, defaultZoom])

  useEffect(() => {
    if (!mapReady) return
    fitToObservations()
  }, [mapReady, fitToObservations])

  const initialView = {
    latitude: defaultLatitude,
    longitude: defaultLongitude,
    zoom: observations.length === 0 ? defaultZoom : 11,
  }

  return (
    <div className={styles.root}>
      <p id={descriptionId} className={pageBodyParagraph}>
        Pins show where {focusSpeciesLabel} was reported on eBird checklists in your
        configured area and time window. All observers’ sightings are included. The
        same rows appear in the table below for keyboard and screen-reader access.
      </p>
      <div
        className={styles.mapShell}
        role="region"
        aria-label={`Map of recent ${focusSpeciesLabel} sightings from eBird`}
        aria-describedby={descriptionId}
      >
        <Map
          ref={mapRef}
          mapLib={maplibregl}
          initialViewState={initialView}
          style={{width: '100%', height: '100%'}}
          mapStyle={SITE_MAP_STYLE}
          onLoad={() => {
            setMapReady(true)
          }}
        >
          <NavigationControl position="top-right" showCompass={false} />
          {observations.map((o) => (
            <Marker
              key={o.id}
              longitude={o.longitude}
              latitude={o.latitude}
              anchor="bottom"
            >
              <a
                href={o.checklistUri}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.marker}
                title={`${o.speciesName} — open checklist on eBird`}
                aria-label={`${o.speciesName}, eBird checklist, opens in new tab`}
              />
            </Marker>
          ))}
        </Map>
      </div>
    </div>
  )
}
