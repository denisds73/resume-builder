import { forwardRef, useId } from 'react'
import type { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, className = '', id, ...props },
  ref,
) {
  const autoId = useId()
  const fieldId = id ?? props.name?.toString() ?? `field-${autoId}`
  return (
    <div>
      <label htmlFor={fieldId} className="mb-1.5 block text-sm text-text-secondary">
        {label}
      </label>
      <textarea
        ref={ref}
        id={fieldId}
        className={`field-textarea ${error ? 'field-error' : ''} ${className}`}
        {...props}
      />
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
    </div>
  )
})
