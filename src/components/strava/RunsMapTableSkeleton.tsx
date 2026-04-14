/** Placeholder while map data loads (Supabase + client map bundle). */
import styles from './RunsMapTableSkeleton.module.css'

export function RunsMapSectionSkeleton() {
  return (
    <section className={styles.section} aria-busy="true" aria-label="Loading map">
      <div className={styles.titleBar}>
        <span className={`${styles.titleShimmer} u-animate-pulse`} aria-hidden />
      </div>
      <p className={styles.textBlock}>
        <span className={`${styles.line} ${styles.lineWide} u-animate-pulse`} aria-hidden />
        <span className={`${styles.line} ${styles.lineNarrow} u-animate-pulse`} aria-hidden />
      </p>
      <div className={`${styles.mapPlaceholder} u-animate-pulse`} />
    </section>
  )
}

/** Placeholder while table data loads (Strava details, gear, Nominatim geocoding). */
export function RunsTableSectionSkeleton() {
  return (
    <section aria-busy="true" aria-label="Loading run list">
      <div className={styles.titleBar}>
        <span className={`${styles.titleShimmer} u-animate-pulse`} aria-hidden style={{width: '10rem'}} />
      </div>
      <p className={styles.textBlock}>
        <span className={`${styles.line} ${styles.lineWide} u-animate-pulse`} aria-hidden />
      </p>
      <div className={`${styles.tablePlaceholder} u-animate-pulse`} />
    </section>
  )
}

/** Placeholder while both sections load (single Suspense fallback). */
export default function RunsMapTableSkeleton() {
  return (
    <div className={styles.root} aria-busy="true" aria-label="Loading map and run list">
      <RunsMapSectionSkeleton />
      <RunsTableSectionSkeleton />
    </div>
  )
}
