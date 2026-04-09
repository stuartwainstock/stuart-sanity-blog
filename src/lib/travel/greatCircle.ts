/**
 * Great-circle paths on the WGS84 sphere (no external arc library — avoids bundler/Babel helper issues).
 * Coordinates are GeoJSON / MapLibre order: [lng, lat].
 */

const D2R = Math.PI / 180
const R2D = 180 / Math.PI

function toRad(deg: number): number {
  return deg * D2R
}

function toDeg(rad: number): number {
  return rad * R2D
}

/** Unit sphere vector from geographic coordinates. */
function latLngToVec(lat: number, lng: number): [number, number, number] {
  const φ = toRad(lat)
  const λ = toRad(lng)
  const cosφ = Math.cos(φ)
  return [cosφ * Math.cos(λ), cosφ * Math.sin(λ), Math.sin(φ)]
}

function normalizeVec(v: [number, number, number]): [number, number, number] {
  const len = Math.hypot(v[0], v[1], v[2])
  if (len < 1e-12) return v
  return [v[0] / len, v[1] / len, v[2] / len]
}

/** Spherical linear interpolation between unit vectors. */
function slerp(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))
  const ω = Math.acos(dot)
  if (ω < 1e-10) return a
  const so = Math.sin(ω)
  const s0 = Math.sin((1 - t) * ω) / so
  const s1 = Math.sin(t * ω) / so
  return [s0 * a[0] + s1 * b[0], s0 * a[1] + s1 * b[1], s0 * a[2] + s1 * b[2]]
}

function vecToLngLat(v: [number, number, number]): [number, number] {
  const [x, y, z] = normalizeVec(v)
  const hyp = Math.hypot(x, y)
  const lat = toDeg(Math.atan2(z, hyp))
  const lng = toDeg(Math.atan2(y, x))
  return [lng, lat]
}

/**
 * Sample a great circle from `start` to `end` as one GeoJSON LineString ring.
 * (Single segment; dateline edge cases are acceptable for itinerary visualization.)
 */
function greatCircleLineStringCoords(
  start: {lat: number; lng: number},
  end: {lat: number; lng: number},
  segments: number,
): [number, number][] {
  const a = normalizeVec(latLngToVec(start.lat, start.lng))
  const b = normalizeVec(latLngToVec(end.lat, end.lng))
  const n = Math.max(2, segments)
  const coords: [number, number][] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const p = normalizeVec(slerp(a, b, t))
    coords.push(vecToLngLat(p))
  }
  return coords
}

/**
 * Great-circle path(s) as GeoJSON-style coordinate rings (one ring unless we split later).
 */
export function greatCircleSegmentsGeoJson(
  start: {lat: number; lng: number},
  end: {lat: number; lng: number},
  npoints = 64,
): [number, number][][] {
  return [greatCircleLineStringCoords(start, end, npoints)]
}

/** Spherical Earth distance (km). */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371
  const φ1 = toRad(lat1)
  const φ2 = toRad(lat2)
  const Δφ = toRad(lat2 - lat1)
  const Δλ = toRad(lng2 - lng1)
  const s =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)))
}
