import { useState } from 'react'
import { LogIn, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { isSupabaseConfigured } from '@/lib/supabase'
import SignInDialog from './SignInDialog'

export default function AuthBar() {
  const { user, loading, signOut } = useAuth()
  const [signInOpen, setSignInOpen] = useState(false)

  if (!isSupabaseConfigured || loading) return null

  if (user) {
    return (
      <button
        type="button"
        onClick={() => signOut()}
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
      >
        <LogOut className="h-4 w-4" />
        {user.email}
      </button>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setSignInOpen(true)}
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text-primary transition-colors hover:border-border-hover"
      >
        <LogIn className="h-4 w-4" />
        Save to cloud
      </button>
      <SignInDialog open={signInOpen} onClose={() => setSignInOpen(false)} />
    </>
  )
}
