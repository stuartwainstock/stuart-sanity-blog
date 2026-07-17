'use client'

import {useId, useState} from 'react'
import {
  AXIS_GROUP_LABEL,
  AXIS_GROUP_ORDER,
  type AxisCoord,
  type AxisDef,
} from '@/lib/typeEmotions/variableFonts'
import {AxisSlider} from './AxisSlider'
import styles from '../TypeEmotionsStudio.module.css'

function groupAxes(axes: readonly AxisDef[]) {
  const buckets: Record<string, AxisDef[]> = {
    core: [],
    parametric: [],
    expression: [],
    other: [],
  }
  for (const axis of axes) {
    const group = axis.group ?? 'other'
    buckets[group].push(axis)
  }
  return buckets
}

export type StageSlider = {
  id: string
  label: string
  tag: string
  min: number
  max: number
  step: number
  value: number
  displayValue: string
  valueText: string
  onChange: (value: number) => void
}

type AxisPanelProps = {
  fontLabel: string
  axes: readonly AxisDef[]
  axisValues: AxisCoord
  onAxisChange: (tag: string, value: number) => void
  stageSliders: StageSlider[]
}

export function AxisPanel({
  fontLabel,
  axes,
  axisValues,
  onAxisChange,
  stageSliders,
}: AxisPanelProps) {
  const axisGroupId = useId()
  const [moreOpen, setMoreOpen] = useState(false)
  const buckets = groupAxes(axes)

  const moreAxes = [
    ...buckets.parametric,
    ...buckets.expression,
    ...buckets.other,
  ]
  const hasMore = moreAxes.length > 0

  return (
    <div className={styles.axisPanel} role="group" aria-labelledby={axisGroupId}>
      <span id={axisGroupId} className={styles.panelLabel}>
        Axes — {fontLabel}
      </span>
      <div className={styles.axisList}>
        {buckets.core.length > 0 ? (
          <div className={styles.axisGroup}>
            <span className={styles.axisGroupLabel}>{AXIS_GROUP_LABEL.core}</span>
            {buckets.core.map((axis) => {
              const value = axisValues[axis.tag] ?? axis.default
              return (
                <AxisSlider
                  key={axis.tag}
                  id={`${axisGroupId}-${axis.tag}`}
                  label={axis.label}
                  tag={axis.tag}
                  min={axis.min}
                  max={axis.max}
                  step={axis.step}
                  value={value}
                  displayValue={String(Number(value.toFixed(axis.step < 1 ? 2 : 0)))}
                  valueText={`${axis.label} ${Number(value.toFixed(2))}`}
                  onChange={(next) => onAxisChange(axis.tag, next)}
                />
              )
            })}
          </div>
        ) : null}

        {hasMore ? (
          <div className={styles.axisGroup}>
            <button
              type="button"
              className={styles.moreAxesToggle}
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((open) => !open)}
            >
              {moreOpen ? 'Fewer axes' : `More axes (${moreAxes.length})`}
            </button>
            {moreOpen
              ? AXIS_GROUP_ORDER.filter((g) => g !== 'core').map((group) => {
                  const groupAxesList = buckets[group]
                  if (!groupAxesList.length) return null
                  return (
                    <div key={group} className={styles.axisSubGroup}>
                      <span className={styles.axisGroupLabel}>{AXIS_GROUP_LABEL[group]}</span>
                      {groupAxesList.map((axis) => {
                        const value = axisValues[axis.tag] ?? axis.default
                        return (
                          <AxisSlider
                            key={axis.tag}
                            id={`${axisGroupId}-${axis.tag}`}
                            label={axis.label}
                            tag={axis.tag}
                            min={axis.min}
                            max={axis.max}
                            step={axis.step}
                            value={value}
                            displayValue={String(
                              Number(value.toFixed(axis.step < 1 ? 2 : 0)),
                            )}
                            valueText={`${axis.label} ${Number(value.toFixed(2))}`}
                            onChange={(next) => onAxisChange(axis.tag, next)}
                          />
                        )
                      })}
                    </div>
                  )
                })
              : null}
            {moreOpen && buckets.other.length > 0
              ? buckets.other.map((axis) => {
                  const value = axisValues[axis.tag] ?? axis.default
                  return (
                    <AxisSlider
                      key={axis.tag}
                      id={`${axisGroupId}-${axis.tag}`}
                      label={axis.label}
                      tag={axis.tag}
                      min={axis.min}
                      max={axis.max}
                      step={axis.step}
                      value={value}
                      displayValue={String(Number(value.toFixed(axis.step < 1 ? 2 : 0)))}
                      valueText={`${axis.label} ${Number(value.toFixed(2))}`}
                      onChange={(next) => onAxisChange(axis.tag, next)}
                    />
                  )
                })
              : null}
          </div>
        ) : null}

        <div className={styles.axisGroup}>
          <span className={styles.axisGroupLabel}>Stage</span>
          {stageSliders.map((slider) => (
            <AxisSlider
              key={slider.id}
              id={slider.id}
              label={slider.label}
              tag={slider.tag}
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={slider.value}
              displayValue={slider.displayValue}
              valueText={slider.valueText}
              onChange={slider.onChange}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
