/**
 * Parse a YouTube watch / Shorts / embed / youtu.be URL to an 11-character video id.
 */
export function parseYouTubeVideoId(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  let urlString = trimmed
  if (!/^https?:\/\//i.test(urlString)) {
    urlString = `https://${urlString}`
  }

  try {
    const u = new URL(urlString)
    const host = u.hostname.replace(/^www\./i, '').toLowerCase()

    if (host === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('/')[0]
      return isLikelyYouTubeId(id) ? id : null
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      const path = u.pathname
      if (path.startsWith('/embed/')) {
        const id = path.slice('/embed/'.length).split('/')[0]
        return isLikelyYouTubeId(id) ? id : null
      }
      if (path.startsWith('/shorts/')) {
        const id = path.slice('/shorts/'.length).split('/')[0]
        return isLikelyYouTubeId(id) ? id : null
      }
      if (path === '/watch' || path === '/watch/') {
        const v = u.searchParams.get('v')
        return v && isLikelyYouTubeId(v) ? v : null
      }
    }
  } catch {
    return null
  }

  return null
}

function isLikelyYouTubeId(id: string): boolean {
  return /^[\w-]{11}$/.test(id)
}

/** Privacy-oriented embed origin used by the site. */
export function youtubeNocookieEmbedSrc(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`
}
