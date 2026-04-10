import 'server-only'

import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {cache} from 'react'

import type {AirportCoords} from '@/lib/travel/types'

type CodeRow = {id: number; iata_code: string | null}
type CoordRow = {id: number; latitude_deg: number; longitude_deg: number}

function shardFile(name: 'codes' | 'coordinates') {
  return path.join(
    process.cwd(),
    'node_modules/ourairports-data-js/dist/data',
    `${name}.json`,
  )
}

/**
 * IATA → lat/lng from ourairports-data-js JSON shards (no OurAirports class — avoids broken
 * ESM loaders under Next.js / Turbopack that call fileURLToPath on non-file URLs).
 */
const loadIataIndex = cache(async (): Promise<Map<string, {lat: number; lng: number}>> => {
  const [codesRaw, coordsRaw] = await Promise.all([
    readFile(shardFile('codes'), 'utf8'),
    readFile(shardFile('coordinates'), 'utf8'),
  ])
  const codes = JSON.parse(codesRaw) as CodeRow[]
  const coords = JSON.parse(coordsRaw) as CoordRow[]

  const byId = new Map<number, {lat: number; lng: number}>()
  for (const c of coords) {
    byId.set(c.id, {lat: c.latitude_deg, lng: c.longitude_deg})
  }

  const iataToPt = new Map<string, {lat: number; lng: number}>()
  for (const row of codes) {
    const iata = row.iata_code?.trim()
    if (!iata) continue
    const pt = byId.get(row.id)
    if (!pt) continue
    const key = iata.toUpperCase()
    if (!iataToPt.has(key)) iataToPt.set(key, pt)
  }

  return iataToPt
})

export async function resolveAirportCoordsForIataCodes(codes: Iterable<string>): Promise<AirportCoords> {
  const index = await loadIataIndex()
  const out: AirportCoords = {}
  for (const code of codes) {
    const key = code.trim().toUpperCase()
    if (!key) continue
    const pt = index.get(key)
    if (pt) out[key] = pt
  }
  return out
}
