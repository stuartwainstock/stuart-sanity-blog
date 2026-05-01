'use client'

import Image from 'next/image'
import {useRef, useState} from 'react'
import styles from './BirdCard.module.css'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BirdSighting {
  _id: string
  speciesName: string
  speciesCode: string
  observedOn: string | null
  locationLabel: string | null
  altText: string | null
  plumageColors: string[] | null
  callAudioUrl: string | null
  ebirdChecklistUri: string | null
  latitude: number | null
  longitude: number | null
  /** Resolved Sanity CDN URL (server maps `cardImage` → URL for next/image). */
  cardImageUrl?: string | null
  /** Alt text for the card photo; falls back to `altText` when empty. */
  cardImageAlt?: string | null
  /** Unsplash suggestion URL (dashboard only: shown while pending review and no `cardImage`). */
  suggestedCoverImageUrl?: string | null
  suggestedCoverImagePageUrl?: string | null
  suggestedCoverPhotographerName?: string | null
  suggestedCoverPhotographerPageUrl?: string | null
  suggestedCoverProvider?: string | null
  imageSuggestionStatus?: string | null
}

interface BirdCardProps {
  sighting: BirdSighting
  /**
   * When true, overrides surface colors with high-contrast values
   * (black background, yellow headings, white borders) to support users
   * with low vision or forced-colors preferences.
   */
  highContrast?: boolean
}

// ── Audio button ──────────────────────────────────────────────────────────────

function AudioButton({url, speciesName}: {url: string; speciesName: string}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState(false)

  function handleClick() {
    const el = audioRef.current
    if (!el) return
    if (playing) {
      el.pause()
      el.currentTime = 0
      setPlaying(false)
    } else {
      el.play().catch(() => setError(true))
      setPlaying(true)
    }
  }

  function handleEnded() {
    setPlaying(false)
  }

  if (error) {
    return (
      <p className={styles.audioError} role="alert">
        Audio unavailable.
      </p>
    )
  }

  return (
    <div className={styles.audioRow}>
      {/* Hidden audio element — controlled programmatically (no captions for bird calls). */}
      <audio ref={audioRef} src={url} onEnded={handleEnded} preload="none" />
      <button
        type="button"
        className={styles.audioButton}
        onClick={handleClick}
        aria-label={`${playing ? 'Stop' : 'Play'} ${speciesName} call`}
        aria-pressed={playing}
      >
        {/* SVG icons keep the tap target clean without icon library dependency */}
        {playing ? (
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" className={styles.audioIcon}>
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" className={styles.audioIcon}>
            <polygon points="5,3 19,12 5,21" />
          </svg>
        )}
        <span className={styles.audioLabel}>{playing ? 'Stop' : 'Listen'}</span>
      </button>
    </div>
  )
}

// ── Plumage swatches ──────────────────────────────────────────────────────────

function PlumageSwatches({colors}: {colors: string[]}) {
  if (colors.length === 0) return null
  return (
    <div className={styles.swatches} aria-hidden="true">
      {colors.map((hex) => (
        <span
          key={hex}
          className={styles.swatch}
          style={{backgroundColor: hex}}
          title={hex}
        />
      ))}
    </div>
  )
}

// ── BirdCard ──────────────────────────────────────────────────────────────────

export function BirdCard({sighting, highContrast = false}: BirdCardProps) {
  const {
    speciesName,
    observedOn,
    locationLabel,
    altText,
    plumageColors,
    callAudioUrl,
    ebirdChecklistUri,
    cardImageUrl,
    cardImageAlt,
    suggestedCoverImageUrl,
    suggestedCoverImagePageUrl,
    suggestedCoverPhotographerName,
    suggestedCoverPhotographerPageUrl,
    suggestedCoverProvider,
    imageSuggestionStatus,
  } = sighting

  const formattedDate = observedOn
    ? new Date(observedOn).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      })
    : null

  const imageAlt =
    (cardImageAlt && cardImageAlt.trim()) ||
    (altText && altText.trim()) ||
    `${speciesName} — sighting card`

  const suggestedPreviewUrl =
    !cardImageUrl &&
    imageSuggestionStatus === 'pending_review' &&
    suggestedCoverImageUrl?.trim()
      ? suggestedCoverImageUrl.trim()
      : null
  const heroImageUrl = cardImageUrl || suggestedPreviewUrl
  const isSuggestedPreview = Boolean(suggestedPreviewUrl)
  const hasUnsplashAttributionBits =
    Boolean(suggestedCoverImagePageUrl?.trim()) ||
    Boolean(suggestedCoverPhotographerName?.trim()) ||
    Boolean(suggestedCoverPhotographerPageUrl?.trim())
  const showUnsplashAttribution =
    (suggestedCoverProvider === 'unsplash' || isSuggestedPreview) &&
    hasUnsplashAttributionBits

  return (
    <article
      className={styles.card}
      data-high-contrast={highContrast || undefined}
      aria-label={altText || speciesName}
    >
      {heroImageUrl ? (
        <figure
          className={styles.cardFigure}
          data-preview={isSuggestedPreview || undefined}
        >
          <Image
            src={heroImageUrl}
            alt={imageAlt}
            width={720}
            height={480}
            className={styles.cardImage}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {isSuggestedPreview ? (
            <figcaption className={styles.previewCaption}>
              Suggested preview — add Card image in Studio to finalize
            </figcaption>
          ) : null}
          {showUnsplashAttribution ? (
            <figcaption className={styles.attributionCaption}>
              <span>Photo</span>
              {suggestedCoverPhotographerName?.trim() ? (
                <>
                  <span>by</span>
                  {suggestedCoverPhotographerPageUrl?.trim() ? (
                    <a
                      href={suggestedCoverPhotographerPageUrl.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {suggestedCoverPhotographerName.trim()}
                    </a>
                  ) : (
                    <span>{suggestedCoverPhotographerName.trim()}</span>
                  )}
                </>
              ) : null}
              <span>on</span>
              {suggestedCoverImagePageUrl?.trim() ? (
                <a
                  href={suggestedCoverImagePageUrl.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Unsplash
                </a>
              ) : (
                <span>Unsplash</span>
              )}
            </figcaption>
          ) : null}
        </figure>
      ) : null}

      <header className={styles.cardHeader}>
        <h3 className={styles.speciesName}>{speciesName}</h3>

        {(formattedDate || locationLabel) && (
          <p className={styles.meta}>
            {formattedDate && (
              <time dateTime={observedOn ?? undefined}>{formattedDate}</time>
            )}
            {formattedDate && locationLabel && (
              <span aria-hidden="true"> · </span>
            )}
            {locationLabel && <span>{locationLabel}</span>}
          </p>
        )}
      </header>

      {plumageColors && plumageColors.length > 0 && (
        <div className={styles.swatchSection}>
          <p className={styles.swatchLabel}>Plumage</p>
          <PlumageSwatches colors={plumageColors} />
        </div>
      )}

      <footer className={styles.cardFooter}>
        {callAudioUrl && (
          <AudioButton url={callAudioUrl} speciesName={speciesName} />
        )}

        {ebirdChecklistUri && (
          <a
            href={ebirdChecklistUri}
            className={styles.checklistLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${speciesName} checklist on eBird (opens in new tab)`}
          >
            View on eBird
          </a>
        )}
      </footer>
    </article>
  )
}
