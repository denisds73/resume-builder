import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, FileText, Sparkles } from 'lucide-react'

export interface WelcomeDialogProps {
  open: boolean
  onClose: () => void
  onUseSample: () => void | Promise<void>
}

export default function WelcomeDialog({ open, onClose, onUseSample }: WelcomeDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-title"
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-24"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative w-full max-w-lg overflow-hidden rounded-xl border border-border bg-bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative px-7 pt-7">
              <span
                aria-hidden
                className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-accent/10 blur-2xl"
              />
              <div className="relative flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-text-muted">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                Welcome to Resumefolio
              </div>
              <h2 id="welcome-title" className="mt-3 font-display text-3xl text-text-primary">
                Build a beautiful resume.
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                Edit on the left, watch the preview update on the right. Switch templates any time, download a PDF, share a public link.
              </p>
            </div>

            <div className="grid gap-3 px-7 py-6 sm:grid-cols-2">
              <button
                type="button"
                onClick={async () => {
                  await onUseSample()
                  onClose()
                }}
                className="group flex items-start gap-3 rounded-xl border border-accent/40 bg-accent/5 p-4 text-left transition-colors hover:border-accent hover:bg-accent/10"
              >
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-background">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-text-primary">
                    Start from a sample
                  </span>
                  <span className="mt-0.5 block text-xs text-text-secondary">
                    A polished example to edit. Fastest way to feel the app.
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="group flex items-start gap-3 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-border-hover"
              >
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-bg-card text-text-secondary">
                  <FileText className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-text-primary">
                    Start blank
                  </span>
                  <span className="mt-0.5 block text-xs text-text-secondary">
                    Fill out each section yourself.
                  </span>
                </span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border bg-surface/40 px-7 py-3 text-xs text-text-muted">
              <span>
                Press <kbd className="rounded border border-border bg-bg-card px-1 py-0.5 font-mono">?</kbd> any time for keyboard shortcuts.
              </span>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1 text-text-secondary transition-colors hover:text-text-primary"
              >
                Skip
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
