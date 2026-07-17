'use client'

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from 'react'
import {createPortal} from 'react-dom'
import Chip from '@/components/atoms/Chip'
import type {SpecimenPalette} from '@/lib/typeEmotions/palettes'
import {
  getVariableFont,
  type AxisCoord,
  type AxisDef,
  type VariableFontKey,
} from '@/lib/typeEmotions/variableFonts'
import {AxisPanel, type StageSlider} from './AxisPanel'
import styles from '../TypeEmotionsStudio.module.css'

const PEEK_STORAGE_KEY = 'type-emotions-settings-peeked'
const PEEK_DELAY_MS = 1400
const MOBILE_MQ = '(max-width: 899px)'
const CARD_WIDTH = 360
const CARD_GAP = 8
const TOGGLE_SIZE = 40
const TOGGLE_INSET = 14

type SettingsDrawerProps = {
  /** Specimen shell — used to park the Aa toggle top-right of the stage. */
  anchorRef: RefObject<HTMLElement | null>
  open: boolean
  onOpenChange: (open: boolean) => void
  fonts: VariableFontKey[]
  labFonts: VariableFontKey[]
  activeFontKey: VariableFontKey
  axes: readonly AxisDef[]
  axisValues: AxisCoord
  onAxisChange: (tag: string, value: number) => void
  sizeSlider: StageSlider
  supportsItalic: boolean
  italic: boolean
  onFontSwitch: (key: VariableFontKey) => void
  onItalicChange: (italic: boolean) => void
  activePalette?: SpecimenPalette
  palettes: SpecimenPalette[]
  paletteOverrideId: string | null
  onPaletteOverride: (id: string | null) => void
}

type SettingsTab = 'axes' | 'font' | 'style' | 'palette'

type FixedBox = {
  top: number
  left: number
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(MOBILE_MQ).matches
}

function visibleTabs(supportsItalic: boolean): SettingsTab[] {
  return (['axes', 'font', 'style', 'palette'] as SettingsTab[]).filter(
    (tab) => tab !== 'style' || supportsItalic,
  )
}

function tabLabel(tab: SettingsTab): string {
  return tab === 'axes' ? 'Axes' : tab[0]!.toUpperCase() + tab.slice(1)
}

export function SettingsDrawer({
  anchorRef,
  open,
  onOpenChange,
  fonts,
  labFonts,
  activeFontKey,
  axes,
  axisValues,
  onAxisChange,
  sizeSlider,
  supportsItalic,
  italic,
  onFontSwitch,
  onItalicChange,
  activePalette,
  palettes,
  paletteOverrideId,
  onPaletteOverride,
}: SettingsDrawerProps) {
  const titleId = useId()
  const panelId = useId()
  const tabPanelId = useId()
  const tabsId = useId()
  const toggleRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const tabRefs = useRef<Partial<Record<SettingsTab, HTMLButtonElement | null>>>({})
  const [mounted, setMounted] = useState(false)
  const [peeking, setPeeking] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [toggleBox, setToggleBox] = useState<FixedBox>({top: 16, left: 16})
  const [cardStyle, setCardStyle] = useState<CSSProperties>({})
  const [activeTab, setActiveTab] = useState<SettingsTab>('axes')

  const tabs = visibleTabs(supportsItalic)
  const activeFont = getVariableFont(activeFontKey)
  const resolvedPalette =
    (paletteOverrideId
      ? palettes.find((p) => p.id === paletteOverrideId)
      : undefined) ?? activePalette

  // Client-only portal mount (must match SSR null output on first paint).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- portal SSR gate
    setMounted(true)
  }, [])

  // If Style disappears (font without italic), land on Axes.
  useEffect(() => {
    if (!supportsItalic && activeTab === 'style') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync tab to available set
      setActiveTab('axes')
    }
  }, [supportsItalic, activeTab])

  const updatePositions = useCallback(() => {
    const shell = anchorRef.current
    if (!shell) return

    const shellRect = shell.getBoundingClientRect()
    const nextMobile = isMobileViewport()
    setMobile(nextMobile)

    if (nextMobile) {
      const toggleTop = window.innerHeight - 16 - TOGGLE_SIZE
      const toggleLeft = window.innerWidth - 16 - TOGGLE_SIZE
      setToggleBox({top: toggleTop, left: toggleLeft})
      setCardStyle({
        top: 'auto',
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        maxHeight: 'min(72vh, 34rem)',
        transformOrigin: '50% 100%',
      })
      return
    }

    // Toggle sits on the specimen; card always hangs *below* it into the stage
    // (never flip up into the live-rail chrome — that was the “still off” disconnect).
    const toggleTop = shellRect.top + TOGGLE_INSET
    const toggleLeft = shellRect.right - TOGGLE_INSET - TOGGLE_SIZE
    setToggleBox({top: toggleTop, left: toggleLeft})

    const width = Math.min(CARD_WIDTH, window.innerWidth - 24)
    let left = toggleLeft + TOGGLE_SIZE - width
    left = Math.max(12, Math.min(left, window.innerWidth - width - 12))

    const top = toggleTop + TOGGLE_SIZE + CARD_GAP
    const spaceBelow = Math.max(120, window.innerHeight - top - 12)
    // Prefer staying inside the specimen shell when there’s room.
    const shellRoom = Math.max(120, shellRect.bottom - top - 8)
    const maxHeight = Math.min(416, spaceBelow, Math.max(shellRoom, 180))

    const originX = toggleLeft + TOGGLE_SIZE / 2 - left
    const originY = 0 // grow down from the edge that touches Aa

    setCardStyle({
      top,
      left,
      right: 'auto',
      bottom: 'auto',
      width,
      maxHeight,
      transformOrigin: `${originX}px ${originY}px`,
    })
  }, [anchorRef])

  useLayoutEffect(() => {
    if (!mounted) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync popover to specimen geometry
    updatePositions()
    window.addEventListener('resize', updatePositions)
    window.addEventListener('scroll', updatePositions, true)
    const mq = window.matchMedia(MOBILE_MQ)
    const onMq = () => updatePositions()
    mq.addEventListener('change', onMq)
    return () => {
      window.removeEventListener('resize', updatePositions)
      window.removeEventListener('scroll', updatePositions, true)
      mq.removeEventListener('change', onMq)
    }
  }, [updatePositions, open, mounted])

  // One-time peek after settle.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (prefersReducedMotion()) return
    try {
      if (sessionStorage.getItem(PEEK_STORAGE_KEY) === '1') return
    } catch {
      return
    }
    const timer = window.setTimeout(() => {
      setPeeking(true)
      try {
        sessionStorage.setItem(PEEK_STORAGE_KEY, '1')
      } catch {
        /* ignore */
      }
      window.setTimeout(() => setPeeking(false), 520)
    }, PEEK_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const toggleEl = toggleRef.current
    const closeEl = closeBtnRef.current
    // Wait a frame so the portaled panel is focusable.
    const focusTimer = window.setTimeout(() => closeEl?.focus(), 0)

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onOpenChange(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', onKeyDown)
      if (previous && typeof previous.focus === 'function' && previous !== closeEl) {
        previous.focus()
      } else {
        toggleEl?.focus()
      }
    }
  }, [open, onOpenChange])

  function focusablesInPanel(): HTMLElement[] {
    if (!panelRef.current) return []
    return Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true')
  }

  function onPanelKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Tab' || !panelRef.current) return
    const focusable = focusablesInPanel()
    if (focusable.length === 0) return
    const first = focusable[0]!
    const last = focusable[focusable.length - 1]!
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  function onTabListKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex < 0) return

    let nextIndex: number | null = null
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % tabs.length
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = tabs.length - 1
    }

    if (nextIndex == null) return
    event.preventDefault()
    const next = tabs[nextIndex]!
    setActiveTab(next)
    tabRefs.current[next]?.focus()
  }

  const selectedPaletteLabel = resolvedPalette?.name ?? 'None'
  const activeTabId = `${tabsId}-${activeTab}`

  const overlay =
    mounted &&
    createPortal(
      <>
        <button
          ref={toggleRef}
          type="button"
          className={[
            styles.settingsToggle,
            open ? styles.settingsToggleOpen : '',
            peeking ? styles.settingsTogglePeek : '',
            mobile ? styles.settingsToggleMobile : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{top: toggleBox.top, left: toggleBox.left}}
          aria-expanded={open}
          aria-controls={panelId}
          aria-haspopup="dialog"
          onClick={() => onOpenChange(!open)}
        >
          <span className={styles.settingsToggleGlyph} aria-hidden>
            Aa
          </span>
          <span className={styles.srOnly}>{open ? 'Close settings' : 'Open settings'}</span>
        </button>

        {open ? (
          <button
            type="button"
            className={styles.settingsBackdrop}
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => onOpenChange(false)}
          />
        ) : null}

        <div
          ref={panelRef}
          id={panelId}
          className={[
            styles.settingsCard,
            mobile ? styles.settingsCardSheet : styles.settingsCardPopover,
            open ? styles.settingsCardOpen : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={cardStyle}
          role="dialog"
          aria-modal={open || undefined}
          aria-labelledby={titleId}
          aria-hidden={!open}
          {...(!open ? {inert: true} : {})}
          onKeyDown={onPanelKeyDown}
        >
          <div className={styles.settingsDrawerHeader}>
            <h2 id={titleId} className={styles.settingsDrawerTitle}>
              Setup
            </h2>
            <button
              ref={closeBtnRef}
              type="button"
              className={styles.settingsClose}
              onClick={() => onOpenChange(false)}
            >
              Close
            </button>
          </div>

          <div
            className={styles.settingsTabs}
            role="tablist"
            aria-label="Setup sections"
            onKeyDown={onTabListKeyDown}
          >
            {tabs.map((tab) => {
              const selected = activeTab === tab
              const id = `${tabsId}-${tab}`
              return (
                <button
                  key={tab}
                  ref={(node) => {
                    tabRefs.current[tab] = node
                  }}
                  type="button"
                  role="tab"
                  id={id}
                  className={[styles.settingsTab, selected ? styles.settingsTabActive : '']
                    .filter(Boolean)
                    .join(' ')}
                  aria-selected={selected}
                  aria-controls={tabPanelId}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveTab(tab)}
                >
                  {tabLabel(tab)}
                </button>
              )
            })}
          </div>

          <div
            className={styles.settingsTabPanel}
            role="tabpanel"
            id={tabPanelId}
            aria-labelledby={activeTabId}
          >
            {activeTab === 'axes' ? (
              <AxisPanel
                fontLabel={activeFont.label}
                axes={axes}
                axisValues={axisValues}
                onAxisChange={onAxisChange}
                stageSliders={[sizeSlider]}
              />
            ) : null}

            {activeTab === 'font' ? (
              <div className={styles.settingsSectionBody}>
                <div className={styles.fontSwitcher} role="group" aria-label="Primary fonts">
                  {fonts.map((key) => {
                    const font = getVariableFont(key)
                    return (
                      <Chip
                        key={key}
                        interactive
                        selected={key === activeFontKey}
                        onClick={() => onFontSwitch(key)}
                      >
                        {font.label}
                      </Chip>
                    )
                  })}
                </div>
                {labFonts.length > 0 ? (
                  <div className={styles.fontSwitcher} role="group" aria-label="Lab fonts">
                    <span className={styles.panelLabel}>Lab</span>
                    {labFonts.map((key) => {
                      const font = getVariableFont(key)
                      return (
                        <Chip
                          key={key}
                          interactive
                          selected={key === activeFontKey}
                          onClick={() => onFontSwitch(key)}
                        >
                          {font.label}
                        </Chip>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeTab === 'style' && supportsItalic ? (
              <div className={styles.settingsSectionBody}>
                <span className={styles.settingsSectionCurrent}>
                  Current: {italic ? 'Italic' : 'Roman'}
                </span>
                <div className={styles.fontSwitcher} role="group" aria-label="Italic style">
                  <Chip interactive selected={!italic} onClick={() => onItalicChange(false)}>
                    Roman
                  </Chip>
                  <Chip interactive selected={italic} onClick={() => onItalicChange(true)}>
                    Italic
                  </Chip>
                </div>
              </div>
            ) : null}

            {activeTab === 'palette' ? (
              <div className={styles.settingsSectionBody}>
                <span className={styles.settingsSectionCurrent}>
                  Current: {selectedPaletteLabel}
                </span>
                {activePalette ? (
                  <div className={styles.palettePickRow}>
                    <button
                      type="button"
                      className={[
                        styles.palettePick,
                        paletteOverrideId === null ? styles.palettePickSelected : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      aria-pressed={paletteOverrideId === null}
                      onClick={() => onPaletteOverride(null)}
                    >
                      <span className={styles.swatches} aria-hidden>
                        {activePalette.swatches.slice(0, 5).map((hex) => (
                          <span
                            key={hex}
                            className={styles.swatch}
                            style={{backgroundColor: `#${hex}`}}
                          />
                        ))}
                      </span>
                      <span className={styles.palettePickLabel}>
                        Emotion default · {activePalette.name}
                      </span>
                    </button>
                  </div>
                ) : null}
                {palettes.map((palette) => {
                  const selected = paletteOverrideId === palette.id
                  return (
                    <div key={palette.id} className={styles.palettePickRow}>
                      <button
                        type="button"
                        className={[
                          styles.palettePick,
                          selected ? styles.palettePickSelected : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        aria-pressed={selected}
                        onClick={() => onPaletteOverride(palette.id)}
                      >
                        <span className={styles.swatches} aria-hidden>
                          {palette.swatches.slice(0, 5).map((hex) => (
                            <span
                              key={hex}
                              className={styles.swatch}
                              style={{backgroundColor: `#${hex}`}}
                            />
                          ))}
                        </span>
                        <span className={styles.palettePickLabel}>{palette.name}</span>
                      </button>
                      {palette.coolorsUrl ? (
                        <a
                          href={palette.coolorsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.paletteLink}
                        >
                          Coolors
                          <span className={styles.srOnly}>
                            {` ${palette.name} (opens in a new tab)`}
                          </span>
                        </a>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            ) : null}
          </div>
        </div>
      </>,
      document.body,
    )

  return overlay
}
