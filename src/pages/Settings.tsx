import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import { TEMPLATE_LIST, type TemplateId } from '@/resume/templates'
import { toast } from '@/lib/toast'
import BrandLoader from '@/components/BrandLoader'

export default function Settings() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg text-text-primary">
        <BrandLoader size="lg" label="Loading" />
      </div>
    )
  }

  if (!isSupabaseConfigured || !user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-bg text-text-primary">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to editor
        </Link>
        <h1 className="mt-6 font-display text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your account, handle, and default preferences.
        </p>

        <div className="mt-10 space-y-10">
          <AccountSection />
          <HandleSection />
          <DefaultTemplateSection />
          <DangerZoneSection />
        </div>
      </div>
    </div>
  )
}

function SectionShell({
  title,
  description,
  children,
  tone = 'default',
}: {
  title: string
  description?: string
  children: React.ReactNode
  tone?: 'default' | 'danger'
}) {
  const border = tone === 'danger' ? 'border-red-500/30' : 'border-border'
  return (
    <section className={`rounded-xl border ${border} bg-surface/30 p-6`}>
      <div className="mb-4">
        <h2 className="font-display text-lg text-text-primary">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        )}
      </div>
      {children}
    </section>
  )
}

function AccountSection() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  async function signOutAll() {
    if (busy) return
    setBusy(true)
    try {
      // scope: 'global' invalidates every session, not just this device.
      await getSupabase().auth.signOut({ scope: 'global' })
      toast.success('Signed out of all sessions')
      navigate('/', { replace: true })
    } catch {
      toast.error('Could not sign out — try again')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SectionShell
      title="Account"
      description="The email tied to your Resumefolio account."
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-text-primary">{user?.email}</p>
          <p className="mt-0.5 text-xs text-text-muted">Signed in</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => signOut().then(() => navigate('/', { replace: true }))}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
          <button
            type="button"
            onClick={signOutAll}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Signing out…' : 'Sign out everywhere'}
          </button>
        </div>
      </div>
    </SectionShell>
  )
}

function HandleSection() {
  const { handle } = useProfile()

  return (
    <SectionShell
      title="Handle"
      description="The @ part of your public resume URL. Locked once chosen."
    >
      {handle ? (
        <div className="rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm">
          resumef.vercel.app/@{handle}
        </div>
      ) : (
        <p className="text-sm text-text-secondary">
          You haven't claimed a handle yet. Open the share panel from the editor to
          claim one.
        </p>
      )}
    </SectionShell>
  )
}

function DefaultTemplateSection() {
  const { defaultTemplate, setDefaultTemplate } = useProfile()
  const [pendingId, setPendingId] = useState<TemplateId | null>(null)
  const active = defaultTemplate ?? 'classic'

  async function pick(id: TemplateId) {
    if (pendingId || id === active) return
    setPendingId(id)
    try {
      await setDefaultTemplate(id)
      toast.success(`Default set to ${labelFor(id)}`)
    } catch {
      toast.error('Could not save default template')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <SectionShell
      title="Default template"
      description="New resumes start with this template. You can still switch any time."
    >
      <div role="radiogroup" aria-label="Default template" className="grid gap-2 sm:grid-cols-3">
        {TEMPLATE_LIST.map((t) => {
          const selected = t.id === active
          const loading = pendingId === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => pick(t.id)}
              disabled={loading}
              className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-3 text-left text-sm transition-colors ${
                selected
                  ? 'border-accent bg-accent/5 text-text-primary'
                  : 'border-border bg-surface text-text-secondary hover:border-border-hover hover:text-text-primary'
              } disabled:opacity-60`}
            >
              <span>
                <span className="block font-medium">{t.name}</span>
                <span className="mt-0.5 block text-xs text-text-muted">
                  {t.description}
                </span>
              </span>
              {selected && <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden />}
            </button>
          )
        })}
      </div>
    </SectionShell>
  )
}

function DangerZoneSection() {
  // Account deletion needs a Supabase RPC (auth.users delete requires service
  // role). Stubbed here so the surface exists; wire to a `delete_account` RPC
  // in a follow-up migration.
  return (
    <SectionShell
      title="Danger zone"
      description="Permanently delete your account and all resumes."
      tone="danger"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">
          Deleting your account is irreversible. Coming soon — contact support to
          delete in the meantime.
        </p>
        <button
          type="button"
          disabled
          className="rounded-lg border border-red-500/40 bg-red-500/5 px-3 py-2 text-sm font-medium text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Delete account
        </button>
      </div>
    </SectionShell>
  )
}

function labelFor(id: TemplateId): string {
  return TEMPLATE_LIST.find((t) => t.id === id)?.name ?? id
}
