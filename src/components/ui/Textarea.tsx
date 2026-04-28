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
        className={`w-full resize-y rounded-lg border bg-surface px-3.5 py-2.5 text-text-primary caret-accent outline-none transition-colors placeholder:text-text-muted focus:border-accent focus:shadow-[0_0_0_3px_rgba(255,90,54,0.12)] focus:outline-none focus-visible:outline-none ${error ? 'border-red-500/70' : 'border-border'} ${className}`}
        {...props}
      />
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
    </div>
  )
})
