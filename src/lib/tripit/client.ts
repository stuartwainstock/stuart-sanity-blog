import 'server-only'

import OAuth from 'oauth-1.0a'
import crypto from 'node:crypto'

const TRIPIT_API_BASE = 'https://api.tripit.com'

function requiredEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing ${name}`)
  return v
}

function createOAuth() {
  const consumerKey = requiredEnv('TRIPIT_CONSUMER_KEY')
  const consumerSecret = requiredEnv('TRIPIT_CONSUMER_SECRET')

  return new OAuth({
    consumer: {key: consumerKey, secret: consumerSecret},
    signature_method: 'HMAC-SHA1',
    hash_function(base_string, key) {
      return crypto.createHmac('sha1', key).update(base_string).digest('base64')
    },
  })
}

function accessToken() {
  return {
    key: requiredEnv('TRIPIT_OAUTH_TOKEN'),
    secret: requiredEnv('TRIPIT_OAUTH_TOKEN_SECRET'),
  }
}

export async function tripitGetJson<T>(pathWithParams: string): Promise<T> {
  const url = `${TRIPIT_API_BASE}${pathWithParams}`
  const oauth = createOAuth()
  const token = accessToken()
  const request_data = {url, method: 'GET' as const}

  const auth = oauth.toHeader(oauth.authorize(request_data, token))

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      ...auth,
      Accept: 'application/json',
      'Accept-Encoding': 'gzip',
      'User-Agent': 'stuart-sanity-blog/1.0',
    },
    // TripIt data changes slowly; rely on Next cache revalidate at call-site
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`TripIt ${res.status} ${res.statusText}${text ? `: ${text}` : ''}`)
  }

  return (await res.json()) as T
}

