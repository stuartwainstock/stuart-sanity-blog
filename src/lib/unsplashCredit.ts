/** Photographer name from Sanity asset `creditLine` (e.g. "Jane Doe by Unsplash"). */
export function photographerNameFromCreditLine(creditLine: string): string {
  const trimmed = creditLine.trim()
  if (!trimmed) return ''
  return trimmed.replace(/\s+by\s+Unsplash$/i, '').trim() || trimmed
}

export function isUnsplashCreditLine(creditLine: string, sourceName?: string): boolean {
  if (sourceName === 'unsplash') return true
  return /\s+by\s+Unsplash$/i.test(creditLine.trim())
}

type ImageWithCredit = {
  credit?: string
  asset?: {
    creditLine?: string
    source?: {name?: string}
  }
}

/** Prefer document `credit`; fall back to Unsplash asset `creditLine`. */
export function resolveImageCredit(image: ImageWithCredit | null | undefined): string | undefined {
  if (!image) return undefined
  const manual = image.credit?.trim()
  if (manual) return manual

  const creditLine = image.asset?.creditLine?.trim()
  if (!creditLine || !isUnsplashCreditLine(creditLine, image.asset?.source?.name)) {
    return undefined
  }

  const name = photographerNameFromCreditLine(creditLine)
  return name || undefined
}
