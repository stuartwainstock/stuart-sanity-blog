'use client'

import {useState} from 'react'
import type {TypedObject} from '@portabletext/types'
import {BirdCard} from '@/components/backyard/BirdCard'
import type {BirdSighting} from '@/components/backyard/BirdCard'
import PortableText from '@/components/molecules/PortableText'
import {pageBodyTypography} from '@/lib/pageTypography'
import styles from './page.module.css'

// ── Types ──────────────────────────────────────────────────────────────────────

interface BirdingGridProps {
  sightings: BirdSighting[]
  /** CMS-driven heading (falls back to 'Recent sightings'). */
  sectionTitle: string
  /** Optional Portable Text intro above the grid. */
  sectionIntroduction?: TypedObject[]
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BirdingGrid({sightings, sectionTitle, sectionIntroduction}: BirdingGridProps) {
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
          {sectionTitle}{' '}
          <span className={styles.gridCount} aria-label={`${sightings.length} sightings`}>
            ({sightings.length})
          </span>
        </h2>

        {/* High-contrast toggle — progressive enhancement for low-vision users */}
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

      {sectionIntroduction && sectionIntroduction.length > 0 && (
        <div className={pageBodyTypography} style={{marginBottom: '1.25rem'}}>
          <PortableText value={sectionIntroduction} pageBodyTypography />
        </div>
      )}

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
