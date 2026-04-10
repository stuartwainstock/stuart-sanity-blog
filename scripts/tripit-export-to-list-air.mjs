#!/usr/bin/env node
/**
 * One-time transform: TripIt account export (Trips → Objects → Flight)
 * → JSON matching the list-air API shape for TRIPIT_FLIGHTS_JSON / fetchTripItFlights.
 *
 * By default writes **slim** segments: only StartDateTime.date + airport IATA codes
 * (what the map uses; smaller file, less incidental detail from TripIt).
 * Pass `--full` to keep the original segment objects (debugging / parity with API).
 *
 * Usage:
 *   node scripts/tripit-export-to-list-air.mjs "/path/to/TripIt Data - You.json"
 *   node scripts/tripit-export-to-list-air.mjs input.json out.json
 *   node scripts/tripit-export-to-list-air.mjs input.json --full
 *
 * Default output: src/data/tripit/list-air-historical.json
 */

import {mkdir, readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

function arr(v) {
  if (v == null) return []
  return Array.isArray(v) ? v : [v]
}

function isEmptySegment(seg) {
  if (seg == null) return true
  if (Array.isArray(seg)) return seg.length === 0
  if (typeof seg !== 'object') return true
  return Object.keys(seg).length === 0
}

function segmentHasLegData(s) {
  return Boolean(
    s?.start_airport_code?.trim() &&
      s?.end_airport_code?.trim() &&
      s?.StartDateTime?.date?.trim(),
  )
}

/**
 * @param {Record<string, unknown>} s - raw TripIt segment
 * @returns {{ StartDateTime: { date: string }, start_airport_code: string, end_airport_code: string }}
 */
function slimSegment(s) {
  const date = (s.StartDateTime && typeof s.StartDateTime === 'object' && 'date' in s.StartDateTime
    ? String(s.StartDateTime.date)
    : ''
  ).trim()
  return {
    StartDateTime: {date},
    start_airport_code: String(s.start_airport_code ?? '').trim(),
    end_airport_code: String(s.end_airport_code ?? '').trim(),
  }
}

/**
 * @param {unknown} data - parsed TripIt export root
 * @param {{ fullSegments: boolean }} opts
 */
function exportToListAir(data, opts) {
  const {fullSegments} = opts
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid JSON: expected an object at root')
  }
  if (!Array.isArray(data.Trips)) {
    throw new Error(
      'This file does not look like a TripIt account export (missing Trips[]). ' +
        'Use the JSON from TripIt’s data export, not the API list-air response.',
    )
  }

  /** @type {unknown[]} */
  const airObjects = []
  let skippedFlightsNoSegmentData = 0

  for (let ti = 0; ti < data.Trips.length; ti++) {
    const trip = data.Trips[ti]
    const objects = arr(trip?.Objects)
    for (let oi = 0; oi < objects.length; oi++) {
      const obj = objects[oi]
      if (!obj || typeof obj !== 'object') continue
      if (obj.display_name !== 'Flight') continue
      if (isEmptySegment(obj.Segment)) {
        skippedFlightsNoSegmentData++
        continue
      }
      const raw = obj.Segment
      const segments = arr(raw).filter(segmentHasLegData)
      if (segments.length === 0) {
        skippedFlightsNoSegmentData++
        continue
      }

      const mapped = fullSegments ? segments : segments.map((s) => slimSegment(/** @type {Record<string, unknown>} */ (s)))

      airObjects.push({
        id: `export-trip${ti}-obj${oi}`,
        display_name: 'Flight',
        Segment: mapped.length === 1 ? mapped[0] : mapped,
      })
    }
  }

  const out = {
    timestamp: new Date().toISOString(),
    num_bytes: '0',
    AirObject: airObjects,
  }

  return {
    out,
    stats: {
      tripCount: data.Trips.length,
      skippedFlightsNoSegmentData,
      airObjectCount: airObjects.length,
    },
  }
}

async function main() {
  const argv = process.argv.slice(2)
  if (argv.length === 0 || argv[0] === '-h' || argv[0] === '--help') {
    console.error(`Usage: node scripts/tripit-export-to-list-air.mjs <tripit-export.json> [output.json] [--full]

  Default: slim segments (date + airport codes only). Use --full to keep TripIt’s full segment payload.
  Default output: src/data/tripit/list-air-historical.json
  Then set TRIPIT_FLIGHTS_JSON to that path (see .env.local.example).`)
    process.exit(argv[0] === '-h' || argv[0] === '--help' ? 0 : 1)
  }

  const fullSegments = argv.includes('--full')
  const positional = argv.filter((a) => a !== '--full')
  const inputArg = positional[0]
  const outputArg = positional[1]

  if (!inputArg) {
    console.error('Missing input JSON path.')
    process.exit(1)
  }

  const inputPath = path.isAbsolute(inputArg) ? inputArg : path.join(process.cwd(), inputArg)
  const defaultOut = path.join(root, 'src/data/tripit/list-air-historical.json')
  const outputPath = outputArg
    ? path.isAbsolute(outputArg)
      ? outputArg
      : path.join(process.cwd(), outputArg)
    : defaultOut

  const raw = await readFile(inputPath, 'utf8')
  const data = JSON.parse(raw)
  const {out, stats} = exportToListAir(data, {fullSegments})

  await mkdir(path.dirname(outputPath), {recursive: true})
  const jsonOut = `${JSON.stringify(out, null, 2)}\n`
  await writeFile(outputPath, jsonOut, 'utf8')

  console.log(`Wrote ${outputPath} (${fullSegments ? 'full' : 'slim'} segments, ${(jsonOut.length / 1024).toFixed(1)} KB)`)
  console.log(`  Trips in export: ${stats.tripCount}`)
  console.log(
    `  AirObject written: ${stats.airObjectCount} (flight bookings with ≥1 segment: airports + date)`,
  )
  console.log(`  Flight rows skipped (empty Segment or missing fields): ${stats.skippedFlightsNoSegmentData}`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
