/**
 * Copy MapLibre worker + shared sibling into public/maplibre/ for setWorkerUrl.
 *
 * MapLibre v6 dropped the CSP worker bundle. The ESM worker imports
 * `./maplibre-gl-shared.mjs` by relative path, so both files must sit in the
 * same public directory. Turbopack does not emit that sibling when resolving
 * `new URL(..., import.meta.url)`, so we host them from /public instead.
 *
 * Runs on postinstall (after npm install / CI).
 */
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'node_modules/maplibre-gl/dist')
const destDir = path.join(root, 'public/maplibre')

const files = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']

const missing = files.filter((name) => !fs.existsSync(path.join(dist, name)))
if (missing.length) {
  console.warn(
    `[copy-maplibre-worker] skip: missing ${missing.join(', ')} (maplibre-gl not installed yet?)`,
  )
  process.exit(0)
}

fs.mkdirSync(destDir, {recursive: true})

// Remove legacy v5 CSP worker if present
const legacy = path.join(root, 'public/maplibre-gl-csp-worker.js')
if (fs.existsSync(legacy)) {
  fs.unlinkSync(legacy)
}

for (const name of files) {
  fs.copyFileSync(path.join(dist, name), path.join(destDir, name))
}
