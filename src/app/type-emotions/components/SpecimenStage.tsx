'use client'

import {
  useId,
  useRef,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {buildVariationSettings} from '@/lib/typeEmotions/intensity'
import type {EmotionSurface} from '@/lib/typeEmotions/catalog'
import type {AxisCoord, AxisDef} from '@/lib/typeEmotions/variableFonts'
import styles from '../TypeEmotionsStudio.module.css'

const SURFACE_CLASS: Record<EmotionSurface, string> = {
  light: styles.surfaceLight,
  mist: styles.surfaceMist,
  warm: styles.surfaceWarm,
  dark: styles.surfaceDark,
  ink: styles.surfaceInk,
}

const DRAG_THRESHOLD_PX = 8

function intensitySurfaceClass(intensity: number): string {
  if (intensity >= 85) return styles.intensityMax
  if (intensity >= 65) return styles.intensityHigh
  return ''
}

function findAxis(axes: readonly AxisDef[], tag: string): AxisDef | undefined {
  return axes.find((a) => a.tag === tag)
}

type SpecimenStageProps = {
  surface: EmotionSurface
  intensity: number
  hasPalette: boolean
  specimenStyle: CSSProperties
  typeStyle: CSSProperties
  displayText: string
  fontLabel: string
  italic: boolean
  axisValues: AxisCoord
  axes: readonly AxisDef[]
  emotionKey: string
  fontKey: string
  onAxisChange: (tag: string, value: number) => void
  onTextChange: (text: string) => void
}

export function SpecimenStage({
  surface,
  intensity,
  hasPalette,
  specimenStyle,
  typeStyle,
  displayText,
  fontLabel,
  italic,
  axisValues,
  axes,
  emotionKey,
  fontKey,
  onAxisChange,
  onTextChange,
}: SpecimenStageProps) {
  const hintId = useId()
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    startWdth: number | null
    startWght: number | null
    dragging: boolean
  } | null>(null)

  const wdthAxis = findAxis(axes, 'wdth')
  const wghtAxis = findAxis(axes, 'wght')
  const canDrag = Boolean(wdthAxis || wghtAxis)

  function onPointerDown(event: ReactPointerEvent<HTMLParagraphElement>) {
    if (!canDrag || event.button !== 0) return
    // While editing (focused textbox), pointer is for caret/selection — not drag.
    if (document.activeElement === event.currentTarget) return

    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startWdth: wdthAxis ? (axisValues.wdth ?? wdthAxis.default) : null,
      startWght: wghtAxis ? (axisValues.wght ?? wghtAxis.default) : null,
      dragging: false,
    }
  }

  function onPointerMove(event: ReactPointerEvent<HTMLParagraphElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY

    if (!drag.dragging) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
      drag.dragging = true
    }

    if (wdthAxis && drag.startWdth != null) {
      const span = wdthAxis.max - wdthAxis.min
      const next = Math.min(
        wdthAxis.max,
        Math.max(wdthAxis.min, drag.startWdth + (dx / 240) * span),
      )
      onAxisChange('wdth', Math.round(next / wdthAxis.step) * wdthAxis.step)
    }
    if (wghtAxis && drag.startWght != null) {
      const span = wghtAxis.max - wghtAxis.min
      // Drag up → heavier
      const next = Math.min(
        wghtAxis.max,
        Math.max(wghtAxis.min, drag.startWght - (dy / 200) * span),
      )
      onAxisChange('wght', Math.round(next / wghtAxis.step) * wghtAxis.step)
    }
  }

  function onPointerUp(event: ReactPointerEvent<HTMLParagraphElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    const wasDragging = drag.dragging
    dragRef.current = null
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      /* already released */
    }

    // Click without drag → enter edit mode (focus the textbox).
    if (!wasDragging) {
      event.currentTarget.focus()
    }
  }

  function onTextInput(event: FormEvent<HTMLParagraphElement>) {
    onTextChange(event.currentTarget.textContent ?? '')
  }

  function onTextKeyDown(event: ReactKeyboardEvent<HTMLParagraphElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur()
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      event.currentTarget.blur()
    }
  }

  const trackingBoost =
    intensity >= 85 ? '0.04em' : intensity >= 65 ? '0.02em' : undefined

  const motionClass =
    intensity >= 85
      ? styles.glyphIntense
      : intensity >= 65
        ? styles.glyphElevated
        : ''

  const dragHint = canDrag
    ? ' Drag to adjust width and weight when not editing. For precise values, open Setup and use the Axes tab.'
    : ' For precise axis values, open Setup and use the Axes tab.'

  return (
    <div
      className={[
        styles.specimen,
        !hasPalette ? SURFACE_CLASS[surface] : '',
        !hasPalette ? intensitySurfaceClass(intensity) : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={specimenStyle}
      key={`${emotionKey}-${fontKey}`}
    >
      <div className={styles.stage}>
        <section className={styles.hero} aria-label="Primary specimen">
          <p id={hintId} className={styles.srOnly}>
            {`Editable specimen text.${dragHint}`}
          </p>
          <p
            className={[styles.glyph, motionClass, canDrag ? styles.glyphDraggable : '']
              .filter(Boolean)
              .join(' ')}
            style={{
              ...typeStyle,
              ...(trackingBoost
                ? {
                    letterSpacing: `calc(${
                      typeof typeStyle.letterSpacing === 'string'
                        ? typeStyle.letterSpacing
                        : '0em'
                    } + ${trackingBoost})`,
                  }
                : {}),
            }}
            role="textbox"
            aria-multiline="false"
            aria-label="Specimen text"
            aria-describedby={hintId}
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onInput={onTextInput}
            onKeyDown={onTextKeyDown}
            title={
              canDrag
                ? 'Click to edit; drag horizontally for width, vertically for weight'
                : 'Click to edit specimen text'
            }
          >
            {displayText}
          </p>
          <p className={styles.cellMeta}>
            ● {fontLabel.toUpperCase()}
            {italic ? ' · ITALIC' : ''} · {buildVariationSettings(axisValues)}
            {canDrag ? ' · DRAG TO SHAPE' : ''}
          </p>
        </section>
      </div>
    </div>
  )
}
