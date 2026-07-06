/** Normalized Unsplash photo shape shared across every server-side Unsplash caller. */
export type UnsplashPhoto = {
  id: string
  thumbUrl: string
  regularUrl: string
  width: number
  height: number
  altDescription: string | null
  photographerName: string | null
  photographerPageUrl: string | null
  photoPageUrl: string | null
  /** POST this to /photos/:id/download (via triggerUnsplashDownload) when the photo is used. */
  downloadLocation: string | null
}
