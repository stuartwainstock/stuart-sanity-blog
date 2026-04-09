/**
 * Single entry for maplibre-gl: polyfill runs first, then CSS once, then the library.
 * Use `mapLib={maplibregl}` on react-map-gl `<Map />` so workers match this bundle.
 *
 * Hosts `maplibre-gl-csp-worker.js` from /public (copied on postinstall) so the worker
 * loads from same origin instead of a blob — avoids blank maps when blob workers fail under CSP.
 */
import '@/lib/maplibreBabelPolyfill'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

if (typeof window !== 'undefined') {
  maplibregl.setWorkerUrl(`${window.location.origin}/maplibre-gl-csp-worker.js`)
}

export { maplibregl }
