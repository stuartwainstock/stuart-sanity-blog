import {createClient} from '@supabase/supabase-js'

/**
 * Server-only Supabase client with the service role key (bypasses RLS).
 * Never import this module from client components.
 */
export function createServerSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Use the Secret key from Supabase (Settings → API), not the publishable/anon key.',
    )
  }
  return createClient(url, key, {
    auth: {persistSession: false, autoRefreshToken: false},
  })
}
