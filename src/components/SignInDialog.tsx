import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, LogIn, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export interface SignInDialogProps {
  open: boolean
  onClose: () => void
}

export default function SignInDialog({ open, onClose }: SignInDialogProps) {
  const { signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setEmail('')
      setSending(false)
      setSent(false)
      setError(null)
    }
  }, [open])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (sending) return
    setSending(true)
    setError(null)
    try {
      await signInWithEmail(email.trim())
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSending(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-24"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full max-w-md rounded-xl border border-border bg-bg-card p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="signin-title"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 id="signin-title" className="font-display text-xl text-text-primary">
                  Save to cloud
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  We'll email you a magic link — no password required.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-md p-1 text-text-muted hover:bg-surface hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {sent ? (
              <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 text-sm">
                <div className="mb-1 flex items-center gap-2 text-accent">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">Check your inbox</span>
                </div>
                <p className="text-text-secondary">
                  We sent a sign-in link to{' '}
                  <span className="text-text-primary">{email.trim()}</span>. Open it on
                  this device to finish.
                </p>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text-primary transition-colors hover:border-border-hover"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="field-label" htmlFor="signin-email">
                    Email
                  </label>
                  <input
                    id="signin-email"
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (error) setError(null)
                    }}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:outline-none focus-visible:outline-none"
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-sm text-red-400"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg px-4 py-2 text-sm text-text-secondary hover:bg-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending || !email.trim()}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogIn className="h-4 w-4" />
                    )}
                    Send link
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
