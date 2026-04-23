'use client'

import {useState} from 'react'
import {BirdCard} from '@/components/backyard/BirdCard'
import type {BirdSighting} from '@/components/backyard/BirdCard'
import styles from './page.module.css'

interface BirdingGridProps {
  sightings: BirdSighting[]
}

export function BirdingGrid({sightings}: BirdingGridProps) {
  const [highContrast, setHighContrast] = useState(false)

  if (sightings.length === 0) {
    return (
      <p className={styles.empty}>
        No sightings synced yet. Use the &quot;Sync from eBird&quot; button above to pull in recent
        observations.
      </p>
    )
  }

  return (
    <section aria-labelledby="sightings-heading" className={styles.gridSection}>
      <div className={styles.gridControls}>
        <h2 id="sightings-heading" className={styles.gridHeading}>
          Recent sightings{' '}
          <span className={styles.gridCount} aria-label={`${sightings.length} sightings`}>
            ({sightings.length})
          </span>
        </h2>

        {/* High-contrast toggle — no JS required to access cards; this is progressive enhancement */}
        <div className={styles.contrastToggle}>
          <label className={styles.contrastLabel} htmlFor="high-contrast-toggle">
            <input
              id="high-contrast-toggle"
              type="checkbox"
              className={styles.contrastCheckbox}
              checked={highContrast}
              onChange={(e) => setHighContrast(e.target.checked)}
              aria-describedby="contrast-hint"
            />
            High contrast
          </label>
          <span id="contrast-hint" className={styles.contrastHint}>
            Black background, yellow headings
          </span>
        </div>
      </div>

      <ul className={styles.grid} role="list" aria-label="Bird sightings">
        {sightings.map((sighting) => (
          <li key={sighting._id} className={styles.gridItem}>
            <BirdCard sighting={sighting} highContrast={highContrast} />
          </li>
        ))}
      </ul>
    </section>
  )
}
