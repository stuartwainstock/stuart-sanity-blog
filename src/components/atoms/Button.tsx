import type {ButtonHTMLAttributes, ReactNode} from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Tone = 'neutral' | 'brand'
type Size = 'sm' | 'md'

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  children: ReactNode
  variant?: Variant
  tone?: Tone
  size?: Size
}

const base =
  'inline-flex items-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
}

const styles: Record<Tone, Record<Variant, string>> = {
  brand: {
    primary: 'bg-orange-700 text-white hover:bg-orange-800 focus:ring-orange-500',
    secondary:
      'border border-orange-300 bg-white text-orange-900 hover:bg-orange-50 focus:ring-orange-500',
    ghost: 'bg-transparent text-orange-900 hover:bg-orange-50 focus:ring-orange-500',
  },
  neutral: {
    primary: 'bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-400',
    secondary: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-300',
    ghost: 'bg-transparent text-gray-900 hover:bg-gray-100 focus:ring-gray-300',
  },
}

export default function Button({
  children,
  variant = 'primary',
  tone = 'neutral',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  const cls = [base, sizes[size], styles[tone][variant], className].filter(Boolean).join(' ')
  return (
    <button type={type} className={cls} {...props}>
      {children}
    </button>
  )
}

