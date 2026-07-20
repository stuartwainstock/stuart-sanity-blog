import 'server-only'
import {createHash, timingSafeEqual} from 'crypto'

/**
 * Server-side password hashing for case studies.
 *
 * Formula: SHA-256(`${salt}:${password}`) as lowercase hex, with a random
 * per-document salt. Plaintext is hashed in admin APIs / Studio-adjacent
 * server routes and stored only in private Supabase (`case_study_access`).
 */
export function hashPassword(salt: string, plaintext: string): string {
  return createHash('sha256').update(`${salt}:${plaintext}`).digest('hex')
}

/** Constant-time comparison of a candidate password against the stored salt + hash. */
export function verifyPassword(
  salt: string | undefined | null,
  hash: string | undefined | null,
  plaintext: string,
): boolean {
  if (!salt || !hash) return false
  const candidate = hashPassword(salt, plaintext)
  const a = Buffer.from(candidate, 'utf8')
  const b = Buffer.from(hash, 'utf8')
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}
