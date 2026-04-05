'use client'

export default function BackyardBirdMapLoading() {
  return (
    <div
      className="space-y-3"
      role="status"
      aria-live="polite"
      aria-label="Loading map"
    >
      <p className="text-sm text-gray-600 max-w-3xl">Loading map…</p>
      <div className="w-full h-[min(70vh,520px)] rounded-lg border border-gray-200 bg-gray-100 animate-pulse" />
    </div>
  )
}
