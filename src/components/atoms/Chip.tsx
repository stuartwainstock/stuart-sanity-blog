import type {ButtonHTMLAttributes, HTMLAttributes, ReactNode} from 'react'
import styles from './Chip.module.css'

type ChipShared = {
  children: ReactNode
  /** Apply CSS `text-transform: capitalize` (e.g. raw media type slugs). */
  capitalize?: boolean
  className?: string
}

export type ChipStaticProps = ChipShared &
  Omit<HTMLAttributes<HTMLSpanElement>, 'children' | 'className'> & {
    /** Display-only label (default). */
    interactive?: false
    selected?: never
  }

export type ChipInteractiveProps = ChipShared &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className' | 'type'> & {
    /** Renders a `<button type="button">` suitable for filters / toggles. */
    interactive: true
    /** When true, shows the selected (pressed) visual and sets `aria-pressed`. */
    selected?: boolean
  }

export type ChipProps = ChipStaticProps | ChipInteractiveProps

function chipClassName({
  capitalize,
  interactive,
  selected,
  className,
}: {
  capitalize?: boolean
  interactive?: boolean
  selected?: boolean
  className?: string
}): string {
  return [
    styles.chip,
    capitalize ? styles.capitalize : '',
    interactive ? styles.interactive : '',
    selected ? styles.selected : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')
}

/**
 * Compact label chip. Default is a non-interactive `<span>` for metadata.
 * Pass `interactive` for toggle/filter chips (`selected` + `aria-pressed`).
 */
export default function Chip(props: ChipProps) {
  if (props.interactive) {
    const {
      children,
      capitalize,
      className,
      selected = false,
      disabled,
      interactive,
      ...rest
    } = props
    void interactive

    return (
      <button
        type="button"
        className={chipClassName({
          capitalize,
          interactive: true,
          selected,
          className,
        })}
        aria-pressed={selected}
        disabled={disabled}
        {...rest}
      >
        {children}
      </button>
    )
  }

  const {children, capitalize, className, interactive, ...rest} = props
  void interactive

  return (
    <span className={chipClassName({capitalize, className})} {...rest}>
      {children}
    </span>
  )
}
