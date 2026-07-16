'use client'

import {useRef, type CSSProperties, type PointerEvent as ReactPointerEvent} from 'react'
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
}: SpecimenStageProps) {
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    startWdth: number | null
    startWght: number | null
  } | null>(null)

  const wdthAxis = findAxis(axes, 'wdth')
  const wghtAxis = findAxis(axes, 'wght')
  const canDrag = Boolean(wdthAxis || wghtAxis)

  function onPointerDown(event: ReactPointerEvent<HTMLParagraphElement>) {
    if (!canDrag || event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startWdth: wdthAxis ? (axisValues.wdth ?? wdthAxis.default) : null,
      startWght: wghtAxis ? (axisValues.wght ?? wghtAxis.default) : null,
    }
  }

  function onPointerMove(event: ReactPointerEvent<HTMLParagraphElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY

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
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null
      try {
        event.currentTarget.releasePointerCapture(event.pointerId)
      } catch {
        /* already released */
      }
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
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            title={
              canDrag
                ? 'Drag horizontally for width, vertically for weight (sliders still work)'
                : undefined
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
