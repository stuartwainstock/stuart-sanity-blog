/**
 * Site-wide MapLibre basemap style.
 *
 * Uses OpenFreeMap (no API key). CARTO’s anonymous raster tiles now return an
 * “API KEY REQUIRED” watermark — see https://carto.com/basemaps/apikey/
 *
 * maplibre-gl stays on 5.x until react-map-gl supports v6 (camera/transform API).
 */
export const SITE_MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

/** @deprecated Prefer SITE_MAP_STYLE. Kept for reference / one-off experiments. */
export const CARTO_POSITRON_STYLE_URL =
  'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
