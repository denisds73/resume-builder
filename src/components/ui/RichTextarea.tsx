import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bold, Italic } from 'lucide-react'
import { getCaretCoordinates } from '@/lib/textareaCaret'

export interface RichTextareaProps {
  label: string
  value: string
  onChange: (next: string) => void
  placeholder?: string
  helper?: string
  error?: string
  rows?: number
}

interface ToolbarState {
  /** Viewport x (center of the selection) */
  x: number
  /** Viewport y (top of the first line in the selection) */
  y: number
}

/**
 * <textarea> with an inline bold/italic toolbar that floats above the
 * current selection. Stored value is plain text with `**bold**` and
 * `*italic*` markdown tokens — no contenteditable, no rich-HTML state.
 *
 * Positioning uses the mirror-div caret technique (see `textareaCaret.ts`)
 * so the tooltip tracks the selection's real on-screen position even
 * after soft-wraps. Hidden when the selection is empty or the textarea
 * loses focus (unless the blur was caused by clicking the toolbar itself).
 */
export function RichTextarea({
  label,
  value,
  onChange,
  placeholder,
  helper,
  error,
  rows = 4,
}: RichTextareaProps) {
  const autoId = useId()
  const inputId = `rich-${autoId}`
  const taRef = useRef<HTMLTextAreaElement>(null)
  const [toolbar, setToolbar] = useState<ToolbarState | null>(null)

  const hideToolbar = useCallback(() => setToolbar(null), [])

  const recomputeToolbar = useCallback(() => {
    const ta = taRef.current
    if (!ta) return
    const { selectionStart, selectionEnd } = ta
    if (selectionStart === selectionEnd) {
      setToolbar(null)
      return
    }
    const start = getCaretCoordinates(ta, selectionStart)
    const end = getCaretCoordinates(ta, selectionEnd)
    const taRect = ta.getBoundingClientRect()
    // Use the first line of the selection as the anchor; if the selection
    // spans multiple lines, `start.top` corresponds to the top-most line.
    const y = taRect.top + start.top - ta.scrollTop
    // Horizontal midpoint of the first-line portion of the selection.
    const sameLineEndLeft = end.top === start.top ? end.left : taRect.width - 12
    const midLeft = (start.left + sameLineEndLeft) / 2
    const x = taRect.left + midLeft - ta.scrollLeft
    setToolbar({ x, y })
  }, [])

  // Recompute on common user interactions
  const onSelectionChange = () => recomputeToolbar()
  const onScroll = () => recomputeToolbar()

  useEffect(() => {
    window.addEventListener('resize', hideToolbar)
    return () => window.removeEventListener('resize', hideToolbar)
  }, [hideToolbar])

  function wrap(prefix: string, suffix: string = prefix) {
    const ta = taRef.current
    if (!ta) return
    const text = ta.value
    const { selectionStart, selectionEnd } = ta
    if (selectionStart === selectionEnd) return

    const before = text.slice(0, selectionStart)
    const selected = text.slice(selectionStart, selectionEnd)
    const after = text.slice(selectionEnd)

    // Toggle-off: selection is already wrapped with the same markers
    const wrappedInside =
      selected.startsWith(prefix) && selected.endsWith(suffix) && selected.length >= prefix.length + suffix.length
    if (wrappedInside) {
      const stripped = selected.slice(prefix.length, selected.length - suffix.length)
      const next = before + stripped + after
      onChange(next)
      requestAnimationFrame(() => {
        ta.focus()
        ta.selectionStart = selectionStart
        ta.selectionEnd = selectionStart + stripped.length
        recomputeToolbar()
      })
      return
    }
    // Toggle-off: selection is adjacent to surrounding markers (user
    // selected only the inner text, not the `**` fences)
    const outsideWrapped = before.endsWith(prefix) && after.startsWith(suffix)
    if (outsideWrapped) {
      const next = before.slice(0, -prefix.length) + selected + after.slice(suffix.length)
      onChange(next)
      requestAnimationFrame(() => {
        ta.focus()
        ta.selectionStart = selectionStart - prefix.length
        ta.selectionEnd = selectionEnd - prefix.length
        recomputeToolbar()
      })
      return
    }

    // Wrap: add the markers around the selection
    const next = before + prefix + selected + suffix + after
    onChange(next)
    requestAnimationFrame(() => {
      ta.focus()
      ta.selectionStart = selectionStart + prefix.length
      ta.selectionEnd = selectionEnd + prefix.length
      recomputeToolbar()
    })
  }

  const hasError = Boolean(error)

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm text-text-secondary">
        {label}
      </label>
      <div className="relative">
        <textarea
          ref={taRef}
          id={inputId}
          rows={rows}
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            // Recompute after the DOM updates so caret math uses the new text
            requestAnimationFrame(recomputeToolbar)
          }}
          onSelect={onSelectionChange}
          onKeyUp={onSelectionChange}
          onMouseUp={onSelectionChange}
          onScroll={onScroll}
          onBlur={(e) => {
            // Ignore blurs where focus went to the toolbar — that's us.
            const next = e.relatedTarget as HTMLElement | null
            if (next?.closest?.('[data-rich-toolbar]')) return
            hideToolbar()
          }}
          placeholder={placeholder}
          className={`w-full resize-y rounded-lg border bg-surface px-4 py-2.5 text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent focus:outline-none focus-visible:outline-none ${
            hasError ? 'border-red-500/80' : 'border-border'
          }`}
        />
      </div>

      <AnimatePresence>
        {toolbar && (
          <motion.div
            data-rich-toolbar
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              left: toolbar.x,
              top: toolbar.y - 44,
              transform: 'translateX(-50%)',
              zIndex: 50,
            }}
            // Prevent the textarea from blurring when user mouses down on
            // the toolbar; otherwise the selection collapses and we lose
            // the target range before the button click registers.
            onMouseDown={(e) => e.preventDefault()}
            className="flex items-center gap-0.5 rounded-lg border border-border bg-bg-card p-1 shadow-2xl"
          >
            <ToolbarButton
              icon={<Bold className="h-3.5 w-3.5" />}
              label="Bold (wrap with **…**)"
              onClick={() => wrap('**')}
            />
            <ToolbarButton
              icon={<Italic className="h-3.5 w-3.5" />}
              label="Italic (wrap with *…*)"
              onClick={() => wrap('*')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {error ? (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      ) : helper ? (
        <p className="mt-1 text-xs text-text-muted">{helper}</p>
      ) : null}
    </div>
  )
}

function ToolbarButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-text-secondary transition-colors hover:bg-surface hover:text-accent"
    >
      {icon}
    </button>
  )
}
