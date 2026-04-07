/** Placeholder while map data loads (Supabase + client map bundle). */
export function RunsMapSectionSkeleton() {
  return (
    <section className="mb-14" aria-busy="true" aria-label="Loading map">
      <div className="mt-10 mb-5">
        <span className="inline-block h-9 w-24 rounded bg-gray-200 animate-pulse" aria-hidden />
      </div>
      <p className="max-w-4xl mb-6">
        <span className="block h-4 w-full max-w-2xl rounded bg-gray-200 animate-pulse mb-2" aria-hidden />
        <span className="block h-4 w-full max-w-xl rounded bg-gray-200 animate-pulse" aria-hidden />
      </p>
      <div className="w-full h-[min(70vh,520px)] rounded-lg border border-gray-200 bg-gray-100 animate-pulse" />
    </section>
  )
}

/** Placeholder while table data loads (Strava details, gear, Nominatim geocoding). */
export function RunsTableSectionSkeleton() {
  return (
    <section aria-busy="true" aria-label="Loading run list">
      <div className="mt-10 mb-5">
        <span className="inline-block h-9 w-40 rounded bg-gray-200 animate-pulse" aria-hidden />
      </div>
      <p className="max-w-4xl mb-6">
        <span className="block h-4 w-full max-w-3xl rounded bg-gray-200 animate-pulse mb-2" aria-hidden />
      </p>
      <div className="rounded-lg border border-gray-200 bg-white h-48 animate-pulse" />
    </section>
  )
}

/** Placeholder while both sections load (single Suspense fallback). */
export default function RunsMapTableSkeleton() {
  return (
    <div className="space-y-14 mb-14" aria-busy="true" aria-label="Loading map and run list">
      <RunsMapSectionSkeleton />
      <RunsTableSectionSkeleton />
    </div>
  )
}
