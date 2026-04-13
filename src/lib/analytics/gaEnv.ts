/**
 * Shared GA env normalization for `/api/analytics` and diagnostic probes.
 * Mutates `process.env` so `sanity-plugin-ga-dashboard/api` sees corrected values.
 */

export function normalizeGaEnvForVercel() {
  const k = process.env.GA_PRIVATE_KEY
  if (k && k.includes('\\n')) {
    process.env.GA_PRIVATE_KEY = k.replace(/\\n/g, '\n')
  }
}

/**
 * Plugin builds URLs as `.../properties/${GA_PROPERTY_ID}:runReport`.
 * GA Admin sometimes shows `properties/123`; if that is pasted verbatim the path is invalid.
 */
export function normalizeGaPropertyId() {
  let id = process.env.GA_PROPERTY_ID?.trim()
  if (!id) return
  if (id.startsWith('properties/')) id = id.slice('properties/'.length)
  if ((id.startsWith('"') && id.endsWith('"')) || (id.startsWith("'") && id.endsWith("'"))) {
    id = id.slice(1, -1)
  }
  process.env.GA_PROPERTY_ID = id
}
