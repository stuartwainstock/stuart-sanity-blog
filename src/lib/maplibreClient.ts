/**
 * Single entry for maplibre-gl: polyfill runs first, then CSS once, then the library.
 * Use `mapLib={maplibregl}` on react-map-gl `<Map />` so workers match this bundle.
 *
 * Hosts MapLibre v6 worker + shared sibling from /public/maplibre (copied on
 * postinstall) so the worker loads same-origin. Required under Next/Turbopack —
 * do not rely on `new URL(..., import.meta.url)` alone.
 *
 * Requires react-map-gl / @vis.gl/react-maplibre >= 8.1.3 (MapLibre 6 camera API).
 */
import '@/lib/maplibreBabelPolyfill'
import * as maplibregl from 'maplibre-gl'
import {setWorkerUrl} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

if (typeof window !== 'undefined') {
  setWorkerUrl(`${window.location.origin}/maplibre/maplibre-gl-worker.mjs`)
}

export {maplibregl}
