/**
 * Site-wide MapLibre basemap style.
 *
 * Uses OpenFreeMap (no API key). CARTO’s anonymous raster tiles now return an
 * “API KEY REQUIRED” watermark — see https://carto.com/basemaps/apikey/
 *
 * Uses MapLibre 6 + react-map-gl >= 8.1.3 (camera API without map.transform).
 */
export const SITE_MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

/** @deprecated Prefer SITE_MAP_STYLE. Kept for reference / one-off experiments. */
export const CARTO_POSITRON_STYLE_URL =
  'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
