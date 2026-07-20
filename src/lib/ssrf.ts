import 'server-only'
import {promises as dns} from 'node:dns'

/**
 * SSRF helpers for outbound fetches controlled by lower-privilege callers
 * (e.g. Quick Add with QUICK_ADD_API_KEY). Validate every hop — never rely on
 * a single pre-check before a client that follows redirects automatically.
 */

const PRIVATE_IPV4_PATTERNS = [
  /^127\./, // loopback
  /^10\./, // RFC 1918
  /^172\.(1[6-9]|2\d|3[01])\./, // RFC 1918
  /^192\.168\./, // RFC 1918
  /^169\.254\./, // link-local + cloud metadata
  /^0\./, // "this" network
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // CGNAT 100.64/10
]

const MAX_REDIRECT_HOPS = 5
const DEFAULT_FETCH_TIMEOUT_MS = 10_000
const DEFAULT_MAX_BODY_BYTES = 1_500_000

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function stripIpv4Mapped(addr: string): string {
  const mapped = addr.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i)
  return mapped ? mapped[1] : addr
}

export function isPrivateOrLocalAddress(addr: string): boolean {
  const normalized = stripIpv4Mapped(addr.trim().toLowerCase())
  if (!normalized) return true

  if (
    normalized === '::1' ||
    normalized === '0:0:0:0:0:0:0:1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80')
  ) {
    return true
  }

  return PRIVATE_IPV4_PATTERNS.some((r) => r.test(normalized))
}

/**
 * True when the URL is http(s), has no embedded credentials, and every resolved
 * A/AAAA address is a public routable address (not loopback/private/link-local/metadata).
 */
export async function isSafeExternalUrl(value: string): Promise<boolean> {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return false
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
  if (parsed.username || parsed.password) return false

  const hostname = parsed.hostname
  if (!hostname) return false

  // Reject raw IP hostnames in private ranges (and bracketed IPv6).
  const hostForIpCheck = hostname.startsWith('[') && hostname.endsWith(']')
    ? hostname.slice(1, -1)
    : hostname
  if (isPrivateOrLocalAddress(hostForIpCheck)) return false

  try {
    const [v4, v6] = await Promise.all([
      dns.resolve4(hostname).catch(() => [] as string[]),
      dns.resolve6(hostname).catch(() => [] as string[]),
    ])
    const addresses = [...v4, ...v6]
    if (addresses.length === 0) {
      // Fall back to lookup when resolve fails (e.g. some environments).
      const v4Lookup = await dns.lookup(hostname, {family: 4, all: true}).catch(() => [])
      const v6Lookup = await dns.lookup(hostname, {family: 6, all: true}).catch(() => [])
      for (const entry of [...v4Lookup, ...v6Lookup]) {
        addresses.push(entry.address)
      }
    }
    if (addresses.length === 0) return false
    for (const addr of addresses) {
      if (isPrivateOrLocalAddress(addr)) return false
    }
  } catch {
    return false
  }

  return true
}

export type SafeFetchHtmlResult =
  | {ok: true; html: string; finalUrl: string}
  | {ok: false; reason: 'unsafe_url' | 'redirect_limit' | 'http_error' | 'too_large' | 'network_error' | 'timeout'}

/**
 * Fetch HTML with redirect: 'manual', re-validating every hop. Caps body size and time.
 */
export async function fetchHtmlFollowingSafeRedirects(
  startUrl: string,
  options?: {
    timeoutMs?: number
    maxHops?: number
    maxBodyBytes?: number
  },
): Promise<SafeFetchHtmlResult> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS
  const maxHops = options?.maxHops ?? MAX_REDIRECT_HOPS
  const maxBodyBytes = options?.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES

  let current = startUrl

  for (let hop = 0; hop <= maxHops; hop++) {
    if (!(await isSafeExternalUrl(current))) {
      return {ok: false, reason: 'unsafe_url'}
    }

    let response: Response
    try {
      response = await fetch(current, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'stuart-sanity-blog-quick-add/1.0',
        },
      })
    } catch (err) {
      if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
        return {ok: false, reason: 'timeout'}
      }
      return {ok: false, reason: 'network_error'}
    }

    if (response.status >= 300 && response.status < 400) {
      if (hop === maxHops) return {ok: false, reason: 'redirect_limit'}
      const location = response.headers.get('location')
      if (!location) return {ok: false, reason: 'http_error'}
      try {
        current = new URL(location, current).toString()
      } catch {
        return {ok: false, reason: 'unsafe_url'}
      }
      continue
    }

    if (!response.ok) {
      return {ok: false, reason: 'http_error'}
    }

    const contentLength = response.headers.get('content-length')
    if (contentLength && Number(contentLength) > maxBodyBytes) {
      return {ok: false, reason: 'too_large'}
    }

    const reader = response.body?.getReader()
    if (!reader) return {ok: false, reason: 'http_error'}

    const chunks: Uint8Array[] = []
    let total = 0
    try {
      while (true) {
        const {done, value} = await reader.read()
        if (done) break
        if (!value) continue
        total += value.byteLength
        if (total > maxBodyBytes) {
          await reader.cancel().catch(() => undefined)
          return {ok: false, reason: 'too_large'}
        }
        chunks.push(value)
      }
    } catch {
      return {ok: false, reason: 'network_error'}
    }

    const merged = new Uint8Array(total)
    let offset = 0
    for (const chunk of chunks) {
      merged.set(chunk, offset)
      offset += chunk.byteLength
    }

    return {
      ok: true,
      html: new TextDecoder('utf-8').decode(merged),
      finalUrl: current,
    }
  }

  return {ok: false, reason: 'redirect_limit'}
}
