import styles from '../TypeEmotionsStudio.module.css'

type AxisSliderProps = {
  id: string
  label: string
  tag?: string
  min: number
  max: number
  step: number
  value: number
  valueText?: string
  displayValue: string
  onChange: (value: number) => void
}

export function AxisSlider({
  id,
  label,
  tag,
  min,
  max,
  step,
  value,
  valueText,
  displayValue,
  onChange,
}: AxisSliderProps) {
  return (
    <div className={styles.axisRow}>
      <label className={styles.axisLabel} htmlFor={id}>
        {label}
        {tag ? <span className={styles.axisTag}>{tag}</span> : null}
      </label>
      <input
        id={id}
        className={styles.slider}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={valueText ?? displayValue}
      />
      <span className={styles.axisValue}>{displayValue}</span>
    </div>
  )
}
