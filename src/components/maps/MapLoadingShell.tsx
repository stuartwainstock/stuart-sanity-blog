'use client'

import styles from './MapLoadingShell.module.css'

export function MapLoadingShell({
  label = 'Loading map…',
  gap = 'small',
  height = 'standard',
  centered = false,
}: {
  label?: string
  gap?: 'small' | 'medium'
  height?: 'standard' | 'tall'
  centered?: boolean
}) {
  const wrapClass = gap === 'medium' ? styles.wrapMediumGap : styles.wrapSmallGap
  const shellClass = `${styles.shell} ${height === 'tall' ? styles.shellTall : ''} ${styles.pulse} ${
    centered ? styles.center : ''
  }`.trim()

  return (
    <div className={wrapClass} role="status" aria-live="polite" aria-label="Loading map">
      {centered ? null : <p className={styles.label}>{label}</p>}
      <div className={shellClass}>{centered ? label : null}</div>
    </div>
  )
}

