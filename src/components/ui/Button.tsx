import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: Variant
  size?: Size
  /** Optional leading icon. Spacing handled here. */
  leadingIcon?: ReactNode
  /** When true the button shows the busy label and disables itself. */
  loading?: boolean
  /** Override the default loading label ("Working…") for primary CTAs. */
  loadingLabel?: string
}

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-background hover:bg-accent-hover font-medium',
  secondary:
    'border border-border bg-surface text-text-primary hover:border-border-hover',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface bg-transparent',
  danger: 'bg-red-500/90 text-white hover:bg-red-500 font-medium',
}

// Sizing aligned with the canonical inline buttons used across the app:
// most submits are px-4 py-2; the toolbar's hero (download) is lg.
const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2 text-sm',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    leadingIcon,
    loading,
    loadingLabel = 'Working…',
    className,
    disabled,
    children,
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading
  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {leadingIcon && <span aria-hidden className="-ml-0.5 inline-flex">{leadingIcon}</span>}
      <span>{loading ? loadingLabel : children}</span>
    </button>
  )
})

export default Button
