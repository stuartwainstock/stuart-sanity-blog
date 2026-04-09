/**
 * Copy MapLibre CSP worker into public/ so we can maplibregl.setWorkerUrl('/maplibre-gl-csp-worker.js').
 * Runs on postinstall (after npm install / CI).
 */
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = path.join(root, 'node_modules/maplibre-gl/dist/maplibre-gl-csp-worker.js')
const dest = path.join(root, 'public/maplibre-gl-csp-worker.js')

if (!fs.existsSync(src)) {
  console.warn('[copy-maplibre-worker] skip: maplibre-gl not installed yet')
  process.exit(0)
}

fs.mkdirSync(path.dirname(dest), {recursive: true})
fs.copyFileSync(src, dest)
