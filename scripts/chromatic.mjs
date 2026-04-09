/**
 * Loads `.env.local` when present so `CHROMATIC_PROJECT_TOKEN` works with `npm run chromatic`
 * without exporting vars manually. CI should set the token in the job environment instead.
 */
import {spawnSync} from 'node:child_process'
import {existsSync} from 'node:fs'
import {config} from 'dotenv'

if (existsSync('.env.local')) {
  config({path: '.env.local'})
}

const extra = process.argv.slice(2)
const result = spawnSync('npx', ['chromatic', ...extra], {
  stdio: 'inherit',
  env: process.env,
  shell: true,
})

process.exit(result.status ?? 1)
