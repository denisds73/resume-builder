import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, LogIn, CheckCircle2, AlertCircle, UserPlus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'

export interface SignInDialogProps {
  open: boolean
  onClose: () => void
}

type Mode = 'magic' | 'password-signin' | 'password-signup'

export default function SignInDialog({ open, onClose }: SignInDialogProps) {
  const { signInWithEmail, signInWithPassword, signUpWithPassword, user } = useAuth()
  const [mode, setMode] = useState<Mode>('magic')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)
  const [pendingConfirm, setPendingConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setMode('magic')
      setEmail('')
      setPassword('')
      setPending(false)
      setSent(false)
      setPendingConfirm(false)
      setError(null)
    }
  }, [open])

  // Close on successful sign-in (session appears via onAuthStateChange).
  useEffect(() => {
    if (open && user) onClose()
  }, [open, user, onClose])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    setPending(true)
    setError(null)
    try {
      if (mode === 'magic') {
        await signInWithEmail(email.trim())
        setSent(true)
      } else if (mode === 'password-signin') {
        await signInWithPassword(email.trim(), password)
        // Dialog closes via the user-watcher effect above.
      } else {
        const { needsConfirmation } = await signUpWithPassword(email.trim(), password)
        if (needsConfirmation) setPendingConfirm(true)
        // else: session already active; user-watcher effect will close.
      }
    } catch (err) {
      setError(mapAuthError(err))
    } finally {
      setPending(false)
    }
  }

  const title =
    mode === 'magic'
      ? 'Save to cloud'
      : mode === 'password-signin'
        ? 'Sign in with password'
        : 'Create an account'

  const subtitle =
    mode === 'magic'
      ? "We'll email you a magic link — no password required."
      : mode === 'password-signin'
        ? 'Use the password you set when creating your account.'
        : 'Choose a password you\u2019ll remember. Minimum 8 characters.'

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
                  {title}
                </h2>
                <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
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
              <SuccessNotice
                icon={<CheckCircle2 className="h-4 w-4" />}
                heading="Check your inbox"
                body={
                  <>
                    We sent a sign-in link to{' '}
                    <span className="text-text-primary">{email.trim()}</span>. Open it on
                    this device to finish.
                  </>
                }
                onClose={onClose}
              />
            ) : pendingConfirm ? (
              <SuccessNotice
                icon={<CheckCircle2 className="h-4 w-4" />}
                heading="Account created — confirm your email"
                body={
                  <>
                    We sent a confirmation link to{' '}
                    <span className="text-text-primary">{email.trim()}</span>. Click it,
                    then come back here and sign in with your password.
                  </>
                }
                onClose={onClose}
              />
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
                    autoFocus={mode === 'magic'}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (error) setError(null)
                    }}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:outline-none focus-visible:outline-none"
                  />
                </div>

                {mode !== 'magic' && (
                  <div>
                    <label className="field-label" htmlFor="signin-password">
                      Password
                    </label>
                    <input
                      id="signin-password"
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (error) setError(null)
                      }}
                      placeholder={mode === 'password-signup' ? 'At least 8 characters' : ''}
                      autoComplete={
                        mode === 'password-signup' ? 'new-password' : 'current-password'
                      }
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:outline-none focus-visible:outline-none"
                    />
                  </div>
                )}

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
                  <Button variant="ghost" type="button" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    leadingIcon={
                      mode === 'password-signup' ? (
                        <UserPlus className="h-4 w-4" />
                      ) : (
                        <LogIn className="h-4 w-4" />
                      )
                    }
                    disabled={
                      !email.trim() || (mode !== 'magic' && password.length < 8)
                    }
                    loading={pending}
                    loadingLabel={
                      mode === 'magic'
                        ? 'Sending…'
                        : mode === 'password-signin'
                          ? 'Signing in…'
                          : 'Creating…'
                    }
                  >
                    {mode === 'magic'
                      ? 'Send link'
                      : mode === 'password-signin'
                        ? 'Sign in'
                        : 'Create account'}
                  </Button>
                </div>

                <ModeToggleFooter mode={mode} onSwitch={setMode} />
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function SuccessNotice({
  icon,
  heading,
  body,
  onClose,
}: {
  icon: React.ReactNode
  heading: string
  body: React.ReactNode
  onClose: () => void
}) {
  return (
    <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 text-sm">
      <div className="mb-1 flex items-center gap-2 text-accent">
        {icon}
        <span className="font-medium">{heading}</span>
      </div>
      <p className="text-text-secondary">{body}</p>
      <div className="mt-4 flex justify-end">
        <Button variant="secondary" type="button" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  )
}

function ModeToggleFooter({
  mode,
  onSwitch,
}: {
  mode: Mode
  onSwitch: (next: Mode) => void
}) {
  // Small, quiet row of links under the primary form. Keeps the
  // magic-link default path visually dominant; the password path is
  // clearly available but not competing for attention.
  const linkClass =
    'font-mono text-[0.65rem] uppercase tracking-[0.18em] text-text-muted transition-colors hover:text-accent'
  if (mode === 'magic') {
    return (
      <div className="flex justify-between pt-2 text-center">
        <button type="button" onClick={() => onSwitch('password-signin')} className={linkClass}>
          Use a password →
        </button>
        <button type="button" onClick={() => onSwitch('password-signup')} className={linkClass}>
          Create account →
        </button>
      </div>
    )
  }
  if (mode === 'password-signin') {
    return (
      <div className="flex justify-between pt-2 text-center">
        <button type="button" onClick={() => onSwitch('magic')} className={linkClass}>
          ← Magic link
        </button>
        <button type="button" onClick={() => onSwitch('password-signup')} className={linkClass}>
          Create account →
        </button>
      </div>
    )
  }
  return (
    <div className="flex justify-between pt-2 text-center">
      <button type="button" onClick={() => onSwitch('magic')} className={linkClass}>
        ← Magic link
      </button>
      <button type="button" onClick={() => onSwitch('password-signin')} className={linkClass}>
        Have an account? Sign in →
      </button>
    </div>
  )
}

function mapAuthError(err: unknown): string {
  const raw = err instanceof Error ? err.message : 'Something went wrong.'
  const lower = raw.toLowerCase()
  if (lower.includes('invalid login credentials')) return 'Wrong email or password.'
  if (lower.includes('already registered') || lower.includes('user already'))
    return 'That email is already registered — sign in instead.'
  if (lower.includes('password') && lower.includes('short'))
    return 'Password must be at least 8 characters.'
  if (lower.includes('email not confirmed'))
    return 'Confirm your email first — check your inbox for the link.'
  return raw
}
