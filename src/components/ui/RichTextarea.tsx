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
  /** Whether the current selection is already wrapped in bold markers */
  isBold: boolean
  /** Whether the current selection is already wrapped in italic markers */
  isItalic: boolean
}

interface SelectionFormat {
  /** Text start offset that covers the inner content (markers excluded) */
  start: number
  /** Text end offset that covers the inner content (markers excluded) */
  end: number
  /** Raw inner text, markers stripped */
  inner: string
  isBold: boolean
  isItalic: boolean
}

/**
 * Inspect the selection's current formatting state. Works whether the
 * selection includes the markers or lives just inside them.
 *
 * Returns normalized coordinates (`start`/`end`) that widen to include
 * any wrapping markers — callers can splice over that range to rebuild
 * the formatted run cleanly.
 */
function parseSelectionFormat(text: string, selectionStart: number, selectionEnd: number): SelectionFormat {
  let start = selectionStart
  let end = selectionEnd
  let inner = text.slice(start, end)
  const before = text.slice(0, start)
  const after = text.slice(end)
  let isBold = false
  let isItalic = false

  // Case A: user included the markers in the selection.
  if (inner.length >= 6 && inner.startsWith('***') && inner.endsWith('***')) {
    isBold = true
    isItalic = true
    inner = inner.slice(3, -3)
  } else if (inner.length >= 4 && inner.startsWith('**') && inner.endsWith('**')) {
    isBold = true
    inner = inner.slice(2, -2)
  } else if (inner.length >= 2 && inner.startsWith('*') && inner.endsWith('*')) {
    isItalic = true
    inner = inner.slice(1, -1)
  } else {
    // Case B: selection is the inner content; markers live adjacent.
    if (before.endsWith('***') && after.startsWith('***')) {
      isBold = true
      isItalic = true
      start -= 3
      end += 3
    } else if (before.endsWith('**') && after.startsWith('**')) {
      isBold = true
      start -= 2
      end += 2
    } else if (before.endsWith('*') && after.startsWith('*')) {
      isItalic = true
      start -= 1
      end += 1
    }
  }

  return { start, end, inner, isBold, isItalic }
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
    const { isBold, isItalic } = parseSelectionFormat(ta.value, selectionStart, selectionEnd)
    setToolbar({ x, y, isBold, isItalic })
  }, [])

  // Recompute on common user interactions
  const onSelectionChange = () => recomputeToolbar()
  const onScroll = () => recomputeToolbar()

  useEffect(() => {
    window.addEventListener('resize', hideToolbar)
    return () => window.removeEventListener('resize', hideToolbar)
  }, [hideToolbar])

  /**
   * Toggle bold or italic on the current selection. Reuses the shared
   * `parseSelectionFormat` so the toolbar's active state and the toggle
   * operation share one source of truth for what's currently applied.
   */
  function toggle(which: 'bold' | 'italic') {
    const ta = taRef.current
    if (!ta) return
    const text = ta.value
    const { selectionStart, selectionEnd } = ta
    if (selectionStart === selectionEnd) return

    const { start, end, inner, isBold: wasBold, isItalic: wasItalic } = parseSelectionFormat(
      text,
      selectionStart,
      selectionEnd,
    )
    const isBold = which === 'bold' ? !wasBold : wasBold
    const isItalic = which === 'italic' ? !wasItalic : wasItalic

    const marker = isBold && isItalic ? '***' : isBold ? '**' : isItalic ? '*' : ''
    const rebuilt = marker + inner + marker

    const newBefore = text.slice(0, start)
    const newAfter = text.slice(end)
    const newText = newBefore + rebuilt + newAfter
    onChange(newText)

    // Re-select the inner text (without markers) so follow-up clicks on
    // B or I target the same word cleanly.
    requestAnimationFrame(() => {
      ta.focus()
      const innerStart = newBefore.length + marker.length
      ta.selectionStart = innerStart
      ta.selectionEnd = innerStart + inner.length
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
              label="Bold"
              active={toolbar.isBold}
              onClick={() => toggle('bold')}
            />
            <ToolbarButton
              icon={<Italic className="h-3.5 w-3.5" />}
              label="Italic"
              active={toolbar.isItalic}
              onClick={() => toggle('italic')}
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
  active = false,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded transition-colors ${
        active
          ? 'bg-accent/15 text-accent'
          : 'text-text-secondary hover:bg-surface hover:text-accent'
      }`}
    >
      {icon}
    </button>
  )
}
