import type {ButtonHTMLAttributes, ReactNode} from 'react'
import styles from './Button.module.css'

type Variant = 'primary' | 'secondary' | 'ghost'
type Tone = 'neutral' | 'brand'
type Size = 'sm' | 'md'

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  children: ReactNode
  variant?: Variant
  tone?: Tone
  size?: Size
}

const sizes: Record<Size, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
}

const variantClasses: Record<Tone, Record<Variant, string>> = {
  brand: {
    primary: styles.brandPrimary,
    secondary: styles.brandSecondary,
    ghost: styles.brandGhost,
  },
  neutral: {
    primary: styles.neutralPrimary,
    secondary: styles.neutralSecondary,
    ghost: styles.neutralGhost,
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
  const cls = [styles.button, sizes[size], variantClasses[tone][variant], className]
    .filter(Boolean)
    .join(' ')
  return (
    <button type={type} className={cls} {...props}>
      {children}
    </button>
  )
}
