import { useState } from 'react'
import { LogIn, LogOut, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { isSupabaseConfigured } from '@/lib/supabase'

export default function AuthBar() {
  const { user, loading, signInWithEmail, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isSupabaseConfigured || loading) return null

  if (user) {
    return (
      <button
        type="button"
        onClick={() => signOut()}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-muted transition-colors hover:text-text-primary"
      >
        <LogOut className="h-3.5 w-3.5" />
        {user.email}
      </button>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-muted transition-colors hover:text-text-primary"
      >
        <LogIn className="h-3.5 w-3.5" />
        Save to cloud
      </button>
    )
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      await signInWithEmail(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <span className="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-muted">
        Check your inbox to finish sign-in.
      </span>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        className="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-primary outline-none transition-colors focus:border-accent"
      />
      <button
        type="submit"
        disabled={sending}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-background transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogIn className="h-3.5 w-3.5" />}
        Send link
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </form>
  )
}
