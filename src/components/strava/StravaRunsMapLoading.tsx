import {pageBodyParagraph} from '@/lib/pageTypography'

export default function StravaRunsMapLoading() {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-live="polite"
      aria-label="Loading map"
    >
      <p className={pageBodyParagraph}>Loading map…</p>
      <div className="w-full h-[min(70vh,520px)] rounded-lg border border-gray-200 bg-gray-100 animate-pulse" />
    </div>
  )
}
