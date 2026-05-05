import type {ReactNode} from 'react'
import Link from 'next/link'
import Button from '@/components/atoms/Button'
import styles from './Pagination.module.css'

type LinkControl = {
  kind: 'link'
  href: string
  label: string
}

type ButtonControl = {
  kind: 'button'
  onClick: () => void
  disabled?: boolean
  label: string
}

type Control = LinkControl | ButtonControl | null

export type PaginationProps = {
  ariaLabel: string
  prev: Control
  next: Control
  meta?: ReactNode
}

function ControlEl(control: Control, disabledLabelFallback: string) {
  if (!control) {
    return (
      <span className={styles.disabled} aria-disabled="true">
        {disabledLabelFallback}
      </span>
    )
  }

  if (control.kind === 'link') {
    return (
      <Link className={styles.linkButton} href={control.href}>
        {control.label}
      </Link>
    )
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={Boolean(control.disabled)}
      onClick={control.onClick}
    >
      {control.label}
    </Button>
  )
}

export function Pagination({ariaLabel, prev, next, meta}: PaginationProps) {
  return (
    <nav className={styles.root} aria-label={ariaLabel}>
      <div className={styles.controls}>
        {ControlEl(prev, 'Previous')}
        {ControlEl(next, 'Next')}
      </div>
      {meta ? <div className={styles.meta}>{meta}</div> : null}
    </nav>
  )
}

