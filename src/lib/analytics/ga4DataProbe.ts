import {importPKCS8, SignJWT} from 'jose'

const GA_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GA_API_BASE = 'https://analyticsdata.googleapis.com/v1beta'
const GA_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly'

export type Ga4ProbeResult =
  | {
      ok: true
      propertyId: string
      rowCount: number
      /** First metric value string if present (e.g. total users) */
      sampleValue?: string
    }
  | {
      ok: false
      propertyId: string | undefined
      phase: 'config' | 'auth' | 'report'
      message: string
      httpStatus?: number
      google?: unknown
    }

async function getAccessToken(): Promise<string> {
  const clientEmail = process.env.GA_SERVICE_ACCOUNT_EMAIL
  const privateKeyRaw = process.env.GA_PRIVATE_KEY
  if (!clientEmail || !privateKeyRaw) {
    throw new Error('Missing GA_SERVICE_ACCOUNT_EMAIL or GA_PRIVATE_KEY')
  }
  const privateKey = privateKeyRaw.replace(/\\n/g, '\n')
  const now = Math.floor(Date.now() / 1000)
  const key = await importPKCS8(privateKey, 'RS256')
  const jwt = await new SignJWT({scope: GA_SCOPE})
    .setProtectedHeader({alg: 'RS256'})
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .setIssuer(clientEmail)
    .setAudience(GA_TOKEN_URL)
    .sign(key)

  const tokenRes = await fetch(GA_TOKEN_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  if (!tokenRes.ok) {
    const text = await tokenRes.text()
    throw new Error(`OAuth token failed (${tokenRes.status}): ${text}`)
  }
  const {access_token: accessToken} = (await tokenRes.json()) as {access_token?: string}
  if (!accessToken) throw new Error('OAuth response missing access_token')
  return accessToken
}

/**
 * Single minimal GA4 Data API call to surface permission / property / API errors
 * that `sanity-plugin-ga-dashboard` hides behind empty `{}` payloads.
 */
export async function probeGa4MinimalReport(): Promise<Ga4ProbeResult> {
  const propertyId = process.env.GA_PROPERTY_ID?.trim()
  if (!propertyId) {
    return {
      ok: false,
      propertyId: undefined,
      phase: 'config',
      message: 'GA_PROPERTY_ID is not set',
    }
  }

  let token: string
  try {
    token = await getAccessToken()
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return {
      ok: false,
      propertyId,
      phase: 'auth',
      message,
    }
  }

  const url = `${GA_API_BASE}/properties/${propertyId}:runReport`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dateRanges: [{startDate: '7daysAgo', endDate: 'today'}],
      metrics: [{name: 'totalUsers'}],
    }),
  })

  const body: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    const g = body as {error?: {message?: string; status?: string}} | null
    return {
      ok: false,
      propertyId,
      phase: 'report',
      message: g?.error?.message ?? `GA Data API HTTP ${res.status}`,
      httpStatus: res.status,
      google: body,
    }
  }

  const parsed = body as {
    rows?: {metricValues?: {value?: string}[]}[] | null
    totals?: {metricValues?: {value?: string}[]}[] | null
  }
  const rows = parsed?.rows ?? []
  const totalStr = parsed?.totals?.[0]?.metricValues?.[0]?.value
  const sampleValue = rows[0]?.metricValues?.[0]?.value ?? totalStr

  return {
    ok: true,
    propertyId,
    rowCount: rows.length,
    sampleValue,
  }
}
