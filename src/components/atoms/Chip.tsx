import type {HTMLAttributes, ReactNode} from 'react'

export type ChipProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  children: ReactNode
  /** Apply Tailwind `capitalize` (e.g. raw media type slugs). */
  capitalize?: boolean
}

const base = 'inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-sm'

export default function Chip({children, className, capitalize: cap, ...props}: ChipProps) {
  const cls = [base, cap ? 'capitalize' : '', className].filter(Boolean).join(' ')
  return (
    <span className={cls} {...props}>
      {children}
    </span>
  )
}
