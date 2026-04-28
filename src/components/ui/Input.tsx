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
        className={`field-input ${error ? 'field-error' : ''} ${className}`}
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
