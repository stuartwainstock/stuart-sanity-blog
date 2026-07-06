import type {HTMLAttributes, ReactNode} from 'react'
import styles from './ListGroupHeading.module.css'

export type ListGroupHeadingProps = Omit<HTMLAttributes<HTMLHeadingElement>, 'children'> & {
  children: ReactNode
  /** Section heading level; use h2 under a page h1 (default). */
  as?: 'h2' | 'h3' | 'h4'
}

export default function ListGroupHeading({
  as: Tag = 'h2',
  className,
  children,
  ...props
}: ListGroupHeadingProps) {
  const cls = [styles.heading, className].filter(Boolean).join(' ')
  return (
    <Tag className={cls} {...props}>
      {children}
    </Tag>
  )
}
