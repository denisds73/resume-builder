import { useState } from 'react'
import { Monitor, Smartphone, ArrowRight, LogIn } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { isSupabaseConfigured } from '@/lib/supabase'
import SignInDialog from './SignInDialog'

export default function MobileBlock() {
  const { loading } = useAuth()
  const [signInOpen, setSignInOpen] = useState(false)
  const showSignIn = isSupabaseConfigured && !loading

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-10 text-text-primary">
      <div className="hero-glow left-1/2 top-1/3 -translate-x-1/2" />
      <div className="hero-noise" />

      <div className="relative z-10 w-full max-w-md text-center">
        <p className="mb-6 font-mono text-[0.7rem] uppercase tracking-[0.22em] text-accent">
          Desktop-first
        </p>

        <div className="mb-8 flex items-center justify-center gap-4 text-text-muted">
          <div className="relative">
            <Smartphone className="h-10 w-10" strokeWidth={1.25} />
            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
              <span className="block h-[2px] w-12 rotate-45 rounded-full bg-accent" />
            </span>
          </div>
          <ArrowRight className="h-4 w-4" />
          <Monitor className="h-10 w-10 text-text-primary" strokeWidth={1.25} />
        </div>

        <h1 className="mb-4 font-display text-4xl leading-tight tracking-tight text-text-primary">
          Editing lives on bigger screens
        </h1>

        <p className="mb-8 font-body text-[0.95rem] leading-relaxed text-text-secondary">
          Resumefolio is a two-pane workspace — editor on one side,
          live preview on the other. Sign in here to view and download
          your saved resumes; come back on a desktop to edit.
        </p>

        {showSignIn && (
          <button
            type="button"
            onClick={() => setSignInOpen(true)}
            className="mb-10 inline-flex items-center gap-2 rounded-lg border border-accent/50 bg-accent/10 px-5 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-accent/15"
          >
            <LogIn className="h-4 w-4" />
            Sign in to view your resumes
          </button>
        )}

        <div className="mx-auto flex max-w-xs flex-col gap-3 border-t border-border pt-6 text-left">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-text-muted">
              01
            </span>
            <span className="text-sm text-text-secondary">
              Sign in here to view and share your saved resumes on the go
            </span>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-text-muted">
              02
            </span>
            <span className="text-sm text-text-secondary">
              Open this URL on a laptop or desktop to edit
            </span>
          </div>
        </div>
      </div>

      <p className="relative z-10 mt-10 font-mono text-[0.6rem] uppercase tracking-[0.24em] text-text-muted">
        Resumefolio
      </p>

      <SignInDialog open={signInOpen} onClose={() => setSignInOpen(false)} />
    </div>
  )
}
