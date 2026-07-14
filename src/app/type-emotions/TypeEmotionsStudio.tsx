'use client'

import {useId, useState, type CSSProperties, type FormEvent} from 'react'
import Button from '@/components/atoms/Button'
import {
  EMOTION_CATALOG,
  SCALE_SAMPLE,
  type EmotionFontRef,
  type EmotionId,
  type EmotionSurface,
} from '@/lib/typeEmotions/catalog'
import {
  INTENSITY_DEFAULT,
  INTENSITY_MAX,
  INTENSITY_MIN,
  applyIntensity,
  intensityLabel,
  type ResolvedIntensityAxes,
} from '@/lib/typeEmotions/intensity'
import {
  paletteToCssVars,
  resolvePaletteRoles,
  SPECIMEN_PALETTES,
} from '@/lib/typeEmotions/palettes'
import {matchEmotion} from '@/lib/typeEmotions/matchEmotion'
import {
  autoLogKind,
  reportTypeEmotionSearchEvent,
} from '@/lib/typeEmotions/reportSearchEvent'
import {SPECIMEN_FONT_VARS} from '@/lib/typeEmotions/specimenFontVars'
import styles from './TypeEmotionsStudio.module.css'

function fontStyle(ref: EmotionFontRef, axes: ResolvedIntensityAxes) {
  return {
    fontFamily: SPECIMEN_FONT_VARS[ref.familyKey],
    fontWeight: ref.weight,
    letterSpacing: axes.tracking,
    lineHeight: axes.leading,
    textTransform: axes.transform,
  } as const
}

function matchNote(match: ReturnType<typeof matchEmotion>): string {
  const {via, matchedOn, score, entry} = match
  if (via === 'id') return `Matched emotion id “${entry.id}”`
  if (via === 'exact' && matchedOn) {
    return `Paired with ${entry.label} via “${matchedOn}” (lexicon)`
  }
  if (via === 'scored' && matchedOn) {
    const pct = typeof score === 'number' ? ` · ${Math.round(score * 100)}%` : ''
    return `Closest pairing: ${entry.label} via “${matchedOn}”${pct}`
  }
  if (via === 'fallback') return 'No lexicon hit — showing Calm as a baseline (logged for review)'
  return `Matched ${entry.label}`
}

const SURFACE_CLASS: Record<EmotionSurface, string> = {
  light: styles.surfaceLight,
  mist: styles.surfaceMist,
  warm: styles.surfaceWarm,
  dark: styles.surfaceDark,
  ink: styles.surfaceInk,
}

function intensitySurfaceClass(intensity: number): string {
  if (intensity >= 85) return styles.intensityMax
  if (intensity >= 65) return styles.intensityHigh
  return ''
}

export function TypeEmotionsStudio() {
  const inputId = useId()
  const intensityId = useId()
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<EmotionId>('calm')
  const [match, setMatch] = useState(() => matchEmotion('calm'))
  const [intensity, setIntensity] = useState(INTENSITY_DEFAULT)
  const [lastSearchQuery, setLastSearchQuery] = useState('')
  const [feedbackSent, setFeedbackSent] = useState(false)

  const entry = match.entry
  const axes = applyIntensity(entry.axes, intensity)
  const palette = entry.paletteId ? SPECIMEN_PALETTES[entry.paletteId] : undefined
  const paletteRoles = palette ? resolvePaletteRoles(palette, intensity) : undefined

  const specimenStyle = {
    '--intensity-glyph-scale': String(axes.glyphScale),
    '--intensity-scale-gap': `${axes.scaleGapRem}rem`,
    ...(paletteRoles ? paletteToCssVars(paletteRoles) : {}),
  } as CSSProperties

  function applyEmotion(nextQuery: string, chipId?: EmotionId) {
    const raw = (chipId ?? nextQuery).trim()
    const resolved = matchEmotion(chipId ?? nextQuery)
    setMatch(resolved)
    setSelectedId(resolved.entry.id)
    setFeedbackSent(false)
    if (chipId) {
      setQuery('')
      setLastSearchQuery('')
    } else {
      setLastSearchQuery(raw)
      const kind = autoLogKind(resolved)
      if (kind && raw) {
        void reportTypeEmotionSearchEvent({query: raw, kind, match: resolved})
      }
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    applyEmotion(query)
  }

  function onFlagPairing() {
    const q = lastSearchQuery || query.trim() || entry.id
    setFeedbackSent(true)
    void reportTypeEmotionSearchEvent({
      query: q,
      kind: 'feedback',
      match,
    })
  }

  return (
    <div className={styles.root}>
      <header className={styles.chrome}>
        <div className={styles.chromeRow}>
          <span className={styles.mark}>TYPE / EMOTIONS</span>
          <span className={styles.meta}>
            ACTIVE — {entry.label.toUpperCase()}
            {match.matchedOn ? ` · VIA ${match.matchedOn.toUpperCase()}` : ''}
            {typeof match.score === 'number' && match.via !== 'fallback'
              ? ` · ${Math.round(match.score * 100)}%`
              : ''}
          </span>
          <span className={styles.meta}>
            INTENSITY — {intensity} · {intensityLabel(intensity).toUpperCase()}
            {palette ? ` · ${palette.name.toUpperCase()}` : ` · ${entry.surface.toUpperCase()}`}
          </span>
        </div>

        <div className={styles.controls}>
          <div className={styles.chips} role="group" aria-label="Emotion presets">
            {EMOTION_CATALOG.map((emotion) => {
              const selected = emotion.id === selectedId
              return (
                <button
                  key={emotion.id}
                  type="button"
                  className={selected ? styles.chipSelected : styles.chip}
                  aria-pressed={selected}
                  onClick={() => applyEmotion(emotion.id, emotion.id)}
                >
                  {emotion.label}
                </button>
              )
            })}
          </div>

          <form className={styles.form} onSubmit={onSubmit}>
            <label className={styles.srOnly} htmlFor={inputId}>
              Describe an emotion
            </label>
            <input
              id={inputId}
              className={styles.input}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Describe an emotion — serene, restless, ceremonial…"
              autoComplete="off"
            />
            <Button type="submit" size="sm" variant="secondary" tone="neutral">
              Match
            </Button>
          </form>

          <div className={styles.intensityRow}>
            <label className={styles.intensityLabel} htmlFor={intensityId}>
              Intensity
            </label>
            <span className={styles.intensityEdge} aria-hidden="true">
              Soft
            </span>
            <input
              id={intensityId}
              className={styles.intensitySlider}
              type="range"
              min={INTENSITY_MIN}
              max={INTENSITY_MAX}
              step={1}
              value={intensity}
              onChange={(event) => setIntensity(Number(event.target.value))}
              aria-valuemin={INTENSITY_MIN}
              aria-valuemax={INTENSITY_MAX}
              aria-valuenow={intensity}
              aria-valuetext={`${intensity}, ${intensityLabel(intensity)}`}
            />
            <span className={styles.intensityEdge} aria-hidden="true">
              Max
            </span>
            <span className={styles.intensityValue}>{intensity}</span>
          </div>

          {palette ? (
            <div className={styles.paletteRow} aria-label={`${palette.name} swatches`}>
              <span className={styles.paletteRowLabel}>Palette</span>
              <div className={styles.swatches}>
                {palette.swatches.map((hex) => (
                  <span
                    key={hex}
                    className={styles.swatch}
                    style={{backgroundColor: `#${hex}`}}
                    title={`#${hex}`}
                  />
                ))}
              </div>
              <a
                href={palette.coolorsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.paletteLink}
              >
                {palette.name}
              </a>
            </div>
          ) : null}

          <p className={styles.matchHint} aria-live="polite">
            {matchNote(match)} · {entry.reason}
          </p>

          <div className={styles.feedbackRow}>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              tone="neutral"
              onClick={onFlagPairing}
              disabled={feedbackSent}
            >
              {feedbackSent ? 'Thanks — logged for review' : 'Not quite right?'}
            </Button>
            <span className={styles.feedbackHint}>
              Flags this pairing so we can refine the lexicon
            </span>
          </div>

          {match.alternatives && match.alternatives.length > 0 ? (
            <div className={styles.altMatches} role="group" aria-label="Other close matches">
              <span className={styles.altMatchesLabel}>Also close</span>
              {match.alternatives.map((alt) => (
                <button
                  key={alt.id}
                  type="button"
                  className={styles.chip}
                  onClick={() => applyEmotion(alt.id, alt.id)}
                >
                  {alt.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      <div
        className={[
          styles.specimen,
          !palette ? SURFACE_CLASS[entry.surface] : '',
          !palette ? intensitySurfaceClass(intensity) : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={specimenStyle}
        key={entry.id}
      >
        <div className={styles.grid}>
          <section className={`${styles.cell} ${styles.heroCell}`} aria-label="Primary specimen">
            <p className={styles.glyph} style={fontStyle(entry.primary, axes)}>
              {entry.specimenWord}
            </p>
            <p className={styles.cellMeta}>
              ● {entry.primary.label.toUpperCase()} · {entry.primary.weight} · PRIMARY · TR{' '}
              {axes.tracking} · LH {axes.leading}
            </p>
          </section>

          <section className={`${styles.cell} ${styles.scaleCell}`} aria-label="Typography scale">
            <p className={styles.scaleLabel}>SCALE — {entry.primary.label.toUpperCase()}</p>
            <div className={styles.scaleStack}>
              <p className={styles.scaleDisplay} style={fontStyle(entry.primary, axes)}>
                {SCALE_SAMPLE}
              </p>
              <p className={styles.scaleTitle} style={fontStyle(entry.primary, axes)}>
                {SCALE_SAMPLE}
              </p>
              <p className={styles.scaleBody} style={fontStyle(entry.primary, axes)}>
                {SCALE_SAMPLE}
              </p>
              <p className={styles.scaleCaption} style={fontStyle(entry.primary, axes)}>
                {SCALE_SAMPLE}
              </p>
            </div>
            <p className={styles.cellMeta}>● DISPLAY · TITLE · BODY · CAPTION</p>
          </section>

          {entry.alternates.map((alt, index) => (
            <section
              key={alt.familyKey}
              className={`${styles.cell} ${styles.altCell}`}
              aria-label={`Alternate ${index + 1}: ${alt.label}`}
            >
              <p className={styles.altWord} style={fontStyle(alt, axes)}>
                {entry.specimenWord}
              </p>
              <p className={styles.cellMeta}>
                ● {alt.label.toUpperCase()} · {alt.weight} · ALT {index + 1}
              </p>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
