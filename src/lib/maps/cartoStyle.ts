import type {StyleSpecification} from 'maplibre-gl'

/**
 * Carto raster “light” basemap (no API key). Uses a/b/c subdomains — more reliable than
 * vector Positron when workers or MVT fetching misbehave in bundled Next.js apps.
 */
export const SITE_MAP_STYLE: StyleSpecification = {
  version: 8,
  name: 'Carto Light raster',
  sources: {
    'carto-raster': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution:
        '© <a href="https://carto.com/" target="_blank" rel="noopener">CARTO</a>, © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: 'carto-light-raster',
      type: 'raster',
      source: 'carto-raster',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
}

/** Vector Positron (optional fallback / reference). Same CDN family as raster. */
export const CARTO_POSITRON_STYLE_URL =
  'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
