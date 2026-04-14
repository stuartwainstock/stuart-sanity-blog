import type {HTMLAttributes, ReactNode} from 'react'
import styles from './Chip.module.css'

export type ChipProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  children: ReactNode
  /** Apply CSS `text-transform: capitalize` (e.g. raw media type slugs). */
  capitalize?: boolean
}

export default function Chip({children, className, capitalize: cap, ...props}: ChipProps) {
  const cls = [styles.chip, cap ? styles.capitalize : '', className].filter(Boolean).join(' ')
  return (
    <span className={cls} {...props}>
      {children}
    </span>
  )
}
