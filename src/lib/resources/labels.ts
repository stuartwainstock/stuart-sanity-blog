/**
 * Human-readable section titles for resource / reading-list media types.
 */
export const MEDIA_TYPE_LABELS: Record<string, string> = {
  article: 'Articles',
  book: 'Books',
  video: 'Videos',
  podcast: 'Podcasts',
  tool: 'Tools',
  other: 'Other',
}

export function getMediaTypeLabel(mediaType: string): string {
  return MEDIA_TYPE_LABELS[mediaType] ?? mediaType
}
