/**
 * Copy MapLibre CSP worker into public/ so we can maplibregl.setWorkerUrl('/maplibre-gl-csp-worker.js').
 * Runs on postinstall (after npm install / CI).
 *
 * Pin maplibre-gl to 5.x until react-map-gl / @vis.gl/react-maplibre supports MapLibre 6
 * (v6 removed map.transform → camera events crash with "reading 'center'").
 */
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = path.join(root, 'node_modules/maplibre-gl/dist/maplibre-gl-csp-worker.js')
const dest = path.join(root, 'public/maplibre-gl-csp-worker.js')

// Clean up MapLibre 6 dual-file copies if present from a prior install
const v6Dir = path.join(root, 'public/maplibre')
if (fs.existsSync(v6Dir)) {
  fs.rmSync(v6Dir, {recursive: true, force: true})
}

if (!fs.existsSync(src)) {
  console.warn('[copy-maplibre-worker] skip: maplibre-gl not installed yet')
  process.exit(0)
}

fs.mkdirSync(path.dirname(dest), {recursive: true})
fs.copyFileSync(src, dest)
