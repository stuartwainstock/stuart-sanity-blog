import type {HTMLAttributes, ReactNode} from 'react'

export type ListGroupHeadingProps = Omit<HTMLAttributes<HTMLHeadingElement>, 'children'> & {
  children: ReactNode
  as?: 'h2' | 'h3' | 'h4'
}

const base = 'text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2'

export default function ListGroupHeading({
  as: Tag = 'h3',
  className,
  children,
  ...props
}: ListGroupHeadingProps) {
  const cls = [base, className].filter(Boolean).join(' ')
  return (
    <Tag className={cls} {...props}>
      {children}
    </Tag>
  )
}
