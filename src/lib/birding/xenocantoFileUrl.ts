/**
 * Xeno-canto API returns `file` as protocol-relative (`//…`) or occasionally
 * path-only. Normalize for `<audio src>` and Sanity `url` fields.
 */
export function normalizeXenocantoFileUrl(raw: string): string {
  const t = raw.trim()
  if (!t) return t
  if (/^https?:\/\//i.test(t)) return t
  if (t.startsWith('//')) return `https:${t}`
  return `https://${t.replace(/^\/+/, '')}`
}
