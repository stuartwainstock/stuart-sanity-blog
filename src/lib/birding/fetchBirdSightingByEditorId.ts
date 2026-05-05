import type {SanityClient} from '@sanity/client'

/**
 * Studio sends the document id the editor is looking at (`drafts.*` or published).
 * When both draft and published exist, `*[_id in $ids][0]` has undefined order and
 * can return the wrong document — missing machine fields or failing lookup. Prefer
 * the caller's id, then the paired draft/published id.
 */
export function pairedBirdSightingId(id: string): string {
  return id.startsWith('drafts.') ? id.slice('drafts.'.length) : `drafts.${id}`
}

export async function fetchBirdSightingByEditorId<T>(
  client: SanityClient,
  id: string,
  projection: string,
): Promise<T | null> {
  const q = `*[_type == "birdSighting" && _id == $docId][0]${projection}`
  const primary = await client.fetch<T | null>(q, {docId: id})
  if (primary) return primary
  return client.fetch<T | null>(q, {docId: pairedBirdSightingId(id)})
}
