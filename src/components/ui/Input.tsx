import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helper?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helper, className = '', id, ...props },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? props.name?.toString() ?? `field-${autoId}`

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm text-text-secondary">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        className={`w-full rounded-lg border bg-surface px-4 py-2.5 text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent ${error ? 'border-red-500/80' : 'border-border'} ${className}`}
        {...props}
      />
      {error ? (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      ) : helper ? (
        <p className="mt-1 text-xs text-text-muted">{helper}</p>
      ) : null}
    </div>
  )
})
