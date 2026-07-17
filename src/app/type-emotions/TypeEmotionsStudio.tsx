'use client'

import {useId, useRef, useState, type CSSProperties, type FormEvent} from 'react'
import Button from '@/components/atoms/Button'
import Chip from '@/components/atoms/Chip'
import {
  EMOTION_CATALOG,
  SPECIMEN_SIZE_DEFAULT,
  SPECIMEN_SIZE_MAX,
  SPECIMEN_SIZE_MIN,
  type EmotionEntry,
  type EmotionId,
} from '@/lib/typeEmotions/catalog'
import {
  INTENSITY_DEFAULT,
  INTENSITY_MAX,
  INTENSITY_MIN,
  buildVariationSettings,
  intensityLabel,
  resolvePresentation,
} from '@/lib/typeEmotions/intensity'
import {
  paletteToCssVars,
  resolvePaletteRoles,
  SPECIMEN_PALETTES,
  type SpecimenPalette,
} from '@/lib/typeEmotions/palettes'
import {matchEmotion, type EmotionMatch} from '@/lib/typeEmotions/matchEmotion'
import {
  autoLogKind,
  reportTypeEmotionSearchEvent,
} from '@/lib/typeEmotions/reportSearchEvent'
import {
  clampAxisCoord,
  defaultAxisCoord,
  fontFamilyStack,
  getVariableFont,
  hydrateVariableFonts,
  LAB_FONT_KEYS,
  type AxisCoord,
  type VariableFontEntry,
  type VariableFontKey,
} from '@/lib/typeEmotions/variableFonts'
import {AxisPanel, type StageSlider} from './components/AxisPanel'
import {EmotionChipRow} from './components/EmotionChipRow'
import {SettingsDrawer} from './components/SettingsDrawer'
import {SpecimenStage} from './components/SpecimenStage'
import styles from './TypeEmotionsStudio.module.css'

function seedFromEmotion(entry: EmotionEntry, intensity: number) {
  const presentation = resolvePresentation(entry, intensity)
  return {
    activeFontKey: entry.fontKey,
    axisValues: presentation.axisValues,
    italic: presentation.italic,
    transform: presentation.transform,
    tracking: presentation.tracking,
    leading: presentation.leading,
    specimenText: entry.specimenWord,
  }
}

export type TypeEmotionsStudioProps = {
  catalog?: EmotionEntry[]
  palettes?: Record<string, SpecimenPalette>
  fonts?: VariableFontEntry[]
}

export function TypeEmotionsStudio({
  catalog = EMOTION_CATALOG,
  palettes = SPECIMEN_PALETTES as Record<string, SpecimenPalette>,
  fonts,
}: TypeEmotionsStudioProps) {
  // Hydrate registry from Sanity-fetched faces (idempotent). Runs on server + client.
  if (fonts && fonts.length > 0) {
    hydrateVariableFonts(fonts)
  }

  const inputId = useId()
  const intensityId = useId()
  const sizeId = useId()
  const specimenShellRef = useRef<HTMLDivElement>(null)

  const initial = matchEmotion('calm', catalog)
  const seeded = seedFromEmotion(initial.entry, INTENSITY_DEFAULT)

  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<EmotionId>(initial.entry.id)
  const [match, setMatch] = useState<EmotionMatch>(initial)
  const [intensity, setIntensity] = useState(INTENSITY_DEFAULT)
  const [activeFontKey, setActiveFontKey] = useState<VariableFontKey>(seeded.activeFontKey)
  const [axisValues, setAxisValues] = useState<AxisCoord>(seeded.axisValues)
  const [italic, setItalic] = useState(seeded.italic)
  const [transform, setTransform] = useState(seeded.transform)
  const [tracking, setTracking] = useState(seeded.tracking)
  const [leading, setLeading] = useState(seeded.leading)
  const [specimenText, setSpecimenText] = useState(seeded.specimenText)
  const [specimenSize, setSpecimenSize] = useState(SPECIMEN_SIZE_DEFAULT)
  const [lastSearchQuery, setLastSearchQuery] = useState('')
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [intensityDrivesAxes, setIntensityDrivesAxes] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [paletteOverrideId, setPaletteOverrideId] = useState<string | null>(null)

  const entry = match.entry
  const activeFont = getVariableFont(activeFontKey)
  const emotionPalette = entry.paletteId ? palettes[entry.paletteId] : undefined
  const palette =
    (paletteOverrideId ? palettes[paletteOverrideId] : undefined) ?? emotionPalette
  const paletteRoles = palette ? resolvePaletteRoles(palette, intensity) : undefined
  const paletteList = Object.values(palettes)
  const permanentAxes = activeFont.axes.filter((axis) => axis.tag === 'opsz')
  const drawerAxes = activeFont.axes.filter((axis) => axis.tag !== 'opsz')

  const switcherFonts: VariableFontKey[] = [
    entry.fontKey,
    ...entry.alternateFontKeys.filter((key) => key !== entry.fontKey),
  ]
  const labFonts = LAB_FONT_KEYS.filter((key) => !switcherFonts.includes(key))

  const specimenStyle = {
    '--specimen-size': `${specimenSize}rem`,
    ...(paletteRoles ? paletteToCssVars(paletteRoles) : {}),
  } as CSSProperties

  const typeStyle = {
    fontFamily: fontFamilyStack(activeFontKey),
    fontStyle: italic ? 'italic' : 'normal',
    fontVariationSettings: buildVariationSettings(axisValues),
    letterSpacing: tracking,
    lineHeight: leading,
    textTransform: transform,
  } as const

  const sizeSlider: StageSlider = {
    id: sizeId,
    label: 'Size',
    tag: 'rem',
    min: SPECIMEN_SIZE_MIN,
    max: SPECIMEN_SIZE_MAX,
    step: 0.1,
    value: specimenSize,
    displayValue: specimenSize.toFixed(1),
    valueText: `${specimenSize.toFixed(1)} rem`,
    onChange: setSpecimenSize,
  }

  const intensitySlider: StageSlider = {
    id: intensityId,
    label: 'Intensity',
    tag: 'macro',
    min: INTENSITY_MIN,
    max: INTENSITY_MAX,
    step: 1,
    value: intensity,
    displayValue: String(intensity),
    valueText: `${intensity}, ${intensityLabel(intensity)}`,
    onChange: onIntensityChange,
  }

  function applyEmotion(nextQuery: string, chipId?: EmotionId) {
    const raw = (chipId ?? nextQuery).trim()
    const resolved = matchEmotion(chipId ?? nextQuery, catalog)
    const next = seedFromEmotion(resolved.entry, INTENSITY_DEFAULT)

    setMatch(resolved)
    setSelectedId(resolved.entry.id)
    setIntensity(INTENSITY_DEFAULT)
    setActiveFontKey(next.activeFontKey)
    setAxisValues(next.axisValues)
    setItalic(next.italic)
    setTransform(next.transform)
    setTracking(next.tracking)
    setLeading(next.leading)
    setSpecimenText(next.specimenText)
    setIntensityDrivesAxes(true)
    setFeedbackSent(false)
    setPaletteOverrideId(null)

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

  function onIntensityChange(next: number) {
    setIntensity(next)
    setIntensityDrivesAxes(true)
    const presentation = resolvePresentation(entry, next)
    if (activeFontKey === entry.fontKey) {
      setAxisValues(presentation.axisValues)
      setItalic(presentation.italic)
      setTransform(presentation.transform)
      setTracking(presentation.tracking)
      setLeading(presentation.leading)
    } else {
      setTransform(presentation.transform)
      setTracking(presentation.tracking)
      setLeading(presentation.leading)
    }
  }

  function onFontSwitch(key: VariableFontKey) {
    setActiveFontKey(key)
    setIntensityDrivesAxes(false)
    if (key === entry.fontKey) {
      const presentation = resolvePresentation(entry, intensity)
      setAxisValues(presentation.axisValues)
      setItalic(presentation.italic)
    } else {
      setAxisValues(defaultAxisCoord(key))
      setItalic(false)
    }
  }

  function onAxisChange(tag: string, value: number) {
    setIntensityDrivesAxes(false)
    setAxisValues((prev) => clampAxisCoord(activeFontKey, {...prev, [tag]: value}))
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

  const displayText = specimenText.trim() || entry.specimenWord

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
            {activeFont.label.toUpperCase()}
            {intensityDrivesAxes
              ? ` · INTENSITY ${intensity} · ${intensityLabel(intensity).toUpperCase()}`
              : ' · MANUAL AXES'}
            {palette ? ` · ${palette.name.toUpperCase()}` : ` · ${entry.surface.toUpperCase()}`}
          </span>
        </div>

        <div className={styles.controls}>
          <EmotionChipRow
            catalog={catalog}
            selectedId={selectedId}
            onSelect={(id) => applyEmotion(id, id)}
          />

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

          <AxisPanel
            fontLabel={activeFont.label}
            axes={permanentAxes}
            axisValues={axisValues}
            onAxisChange={onAxisChange}
            stageSliders={[intensitySlider]}
          />

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
                <Chip key={alt.id} interactive onClick={() => applyEmotion(alt.id, alt.id)}>
                  {alt.label}
                </Chip>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      <div ref={specimenShellRef} className={styles.specimenShell}>
        <SpecimenStage
          surface={entry.surface}
          intensity={intensity}
          hasPalette={Boolean(palette)}
          specimenStyle={specimenStyle}
          typeStyle={typeStyle}
          displayText={displayText}
          fontLabel={activeFont.label}
          italic={italic}
          axisValues={axisValues}
          axes={activeFont.axes}
          emotionKey={entry.id}
          fontKey={activeFontKey}
          onAxisChange={onAxisChange}
          onTextChange={setSpecimenText}
        />
      </div>

      <SettingsDrawer
        anchorRef={specimenShellRef}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        fonts={switcherFonts}
        labFonts={labFonts}
        activeFontKey={activeFontKey}
        axes={drawerAxes}
        axisValues={axisValues}
        onAxisChange={onAxisChange}
        sizeSlider={sizeSlider}
        supportsItalic={Boolean(activeFont.supportsItalic)}
        italic={italic}
        onFontSwitch={onFontSwitch}
        onItalicChange={(next) => {
          setIntensityDrivesAxes(false)
          setItalic(next)
        }}
        activePalette={emotionPalette}
        palettes={paletteList}
        paletteOverrideId={paletteOverrideId}
        onPaletteOverride={setPaletteOverrideId}
      />
    </div>
  )
}
