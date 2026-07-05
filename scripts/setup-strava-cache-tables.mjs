/**
 * Verify Strava cache tables exist; print setup SQL if missing.
 * Usage: node --env-file=.env.local scripts/setup-strava-cache-tables.mjs
 */
import {readFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {dirname, join} from 'node:path'
import {createClient} from '@supabase/supabase-js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const reverseGeocodeSql = readFileSync(
  join(root, 'scripts/supabase-strava-reverse-geocode-cache.sql'),
  'utf8',
)
const gearSql = readFileSync(join(root, 'scripts/supabase-strava-gear-cache.sql'), 'utf8')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment.')
  process.exit(1)
}

const supabase = createClient(url, key)

const [geo, gear] = await Promise.all([
  supabase.from('strava_reverse_geocode_cache').select('bucket_key').limit(1),
  supabase.from('strava_gear_cache').select('gear_id').limit(1),
])

const missing = []
if (geo.error?.code === 'PGRST205') missing.push('strava_reverse_geocode_cache')
if (gear.error?.code === 'PGRST205') missing.push('strava_gear_cache')

if (missing.length === 0) {
  console.log('Strava cache tables are present.')
  process.exit(0)
}

console.log(`Missing table(s): ${missing.join(', ')}`)
console.log('Run the following SQL in the Supabase SQL editor:\n')
if (missing.includes('strava_reverse_geocode_cache')) console.log(reverseGeocodeSql)
if (missing.includes('strava_gear_cache')) console.log(gearSql)
process.exit(1)
