import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, FileText, LogIn, LogOut, Settings as SettingsIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useDismiss } from '@/lib/useDismiss'
import { MOTION } from '@/lib/motion'
import SignInDialog from './SignInDialog'

export default function AuthBar() {
  const { user, loading, signOut } = useAuth()
  const [signInOpen, setSignInOpen] = useState(false)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useDismiss(open, () => setOpen(false), rootRef)

  if (!isSupabaseConfigured || loading) return null

  if (user) {
    return (
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
        >
          <span className="max-w-[180px] truncate">{user.email}</span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: MOTION.fast }}
              className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-bg-card shadow-lg shadow-black/40"
            >
              <Link
                to="/resumes"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
              >
                <FileText className="h-4 w-4" />
                All resumes
              </Link>
              <Link
                to="/settings"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 border-t border-border px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
              >
                <SettingsIcon className="h-4 w-4" />
                Settings
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  signOut()
                }}
                className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
