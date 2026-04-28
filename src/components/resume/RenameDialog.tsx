import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import Button from '@/components/ui/Button'
import { MOTION, EASE } from '@/lib/motion'

export interface RenameDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (next: string) => Promise<void> | void
  /** Current name shown as the initial input value when opening. */
  initialName: string
  title?: string
  submitLabel?: string
}

/**
 * Shared rename modal used by the editor and the dashboard. Replaces
 * two inline copies that had drifted on a11y (one had role=dialog,
 * the other did not), motion (no AnimatePresence), Escape handling,
 * and close-button presence. Mirrors the standard modal tokens used
 * by ConfirmDialog / NewResumeDialog so the family looks identical.
 */
export default function RenameDialog({
  open,
  onClose,
  onSubmit,
  initialName,
  title = 'Rename resume',
  submitLabel = 'Rename',
}: RenameDialogProps) {
  return (
    <AnimatePresence>{open && <Inner {...{ onClose, onSubmit, initialName, title, submitLabel }} />}</AnimatePresence>
  )
}

function Inner({
  onClose,
  onSubmit,
  initialName,
  title,
  submitLabel,
}: Omit<RenameDialogProps, 'open'> & { title: string; submitLabel: string }) {
  const [value, setValue] = useState(initialName)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  async function submit() {
    const next = value.trim()
    if (!next || busy) return
    setBusy(true)
    try {
      await onSubmit(next)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rename-title"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: MOTION.backdrop }}
      onClick={() => !busy && onClose()}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: MOTION.base, ease: EASE.out }}
        className="w-full max-w-md rounded-xl border border-border bg-bg-card p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id="rename-title" className="font-display text-xl text-text-primary">
            {title}
          </h2>
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
        <label className="field-label" htmlFor="rename-input">
          Name
        </label>
        <input
          id="rename-input"
          className="field-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
          autoFocus
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!value.trim() || busy} loading={busy}>
            {submitLabel}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
