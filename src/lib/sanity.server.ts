/**
 * Server-only Sanity write client factory.
 *
 * Import this ONLY in Server Actions, Route Handlers, and other server-only
 * modules. Never import it in components or any file that could be bundled
 * for the browser — the write token must stay server-side.
 *
 * Token: SANITY_API_WRITE_TOKEN (Editor permission or higher).
 */
import {createClient} from '@sanity/client'
import type {SanityClient} from '@sanity/client'

export function getSanityWriteClient(): SanityClient {
  const token = process.env.SANITY_API_WRITE_TOKEN
  if (!token) throw new Error('SANITY_API_WRITE_TOKEN is not set.')

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  if (!projectId) throw new Error('NEXT_PUBLIC_SANITY_PROJECT_ID is not set.')

  return createClient({
    projectId,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
    apiVersion: '2023-05-03',
    token,
    useCdn: false,
  })
}
