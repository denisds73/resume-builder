import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

export interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void

  title: string
  description?: string
  /**
   * Words the user must type verbatim to enable the confirm button.
   * Use this for irreversible actions (delete account, delete resume).
   */
  confirmText?: string
  confirmLabel?: string
  cancelLabel?: string
  /**
   * Visual treatment for the confirm button.
   * - 'danger' (default): red, signals destruction
   * - 'primary': accent, for non-destructive but consequential actions
   */
  tone?: 'danger' | 'primary'
}

export default function ConfirmDialog(props: ConfirmDialogProps) {
  // Inner content is keyed on open so its local state (typed text, busy)
  // resets every time the dialog reopens — no effect-driven resets needed.
  return (
    <AnimatePresence>{props.open && <ConfirmInner {...props} />}</AnimatePresence>
  )
}

function ConfirmInner({
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const cancelRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose()
    }
    document.addEventListener('keydown', onKey)
    cancelRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  const matched = !confirmText || typed === confirmText
  const canConfirm = matched && !busy

  async function handleConfirm() {
    if (!canConfirm) return
    setBusy(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setBusy(false)
    }
  }

  const confirmCls =
    tone === 'danger'
      ? 'bg-red-500/90 text-white hover:bg-red-500'
      : 'bg-accent text-background hover:bg-accent-hover'

  return (
    <motion.div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby={description ? 'confirm-desc' : undefined}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={() => !busy && onClose()}
    >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full max-w-md rounded-xl border border-border bg-bg-card p-6 shadow-2xl"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full ${
                    tone === 'danger' ? 'bg-red-500/15 text-red-400' : 'bg-accent/15 text-accent'
                  }`}
                  aria-hidden
                >
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <h2 id="confirm-title" className="font-display text-xl text-text-primary">
                  {title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                aria-label="Close"
                className="rounded-md p-1 text-text-muted hover:bg-surface hover:text-text-primary disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {description && (
              <p id="confirm-desc" className="mb-5 ml-11 text-sm text-text-secondary">
                {description}
              </p>
            )}

            {confirmText && (
              <div className="mb-5 ml-11">
                <label className="field-label" htmlFor="confirm-input">
                  Type <span className="font-mono text-text-primary">{confirmText}</span> to confirm
                </label>
                <input
                  id="confirm-input"
                  className="field-input"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && canConfirm) handleConfirm()
                  }}
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                ref={cancelRef}
                type="button"
                onClick={onClose}
                disabled={busy}
                className="rounded-lg px-4 py-2 text-sm text-text-secondary hover:bg-surface disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!canConfirm}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${confirmCls}`}
              >
                {busy ? 'Working…' : confirmLabel}
              </button>
            </div>
      </motion.div>
    </motion.div>
  )
}
