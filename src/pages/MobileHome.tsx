import { useEffect, useState } from 'react'
import { ChevronRight, Download, LogOut, ArrowLeft, Pencil } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useResumes } from '@/hooks/useResumes'
import { useProfile } from '@/hooks/useProfile'
import type { ResumeRow } from '@/lib/supabase'
import { getTemplate } from '@/resume/templates'
import { downloadResumePdf } from '@/pdf/download'
import { toast } from '@/lib/toast'
import BrandLoader from '@/components/BrandLoader'
import TemplateThumbnail from '@/components/resume/TemplateThumbnail'
import ResumePreview from '@/components/resume/ResumePreview'

type View = { kind: 'list' } | { kind: 'one'; id: string }

export default function MobileHome() {
  const { user, signOut } = useAuth()
  const { resumes, status } = useResumes()
  const { handle } = useProfile()
  const [view, setView] = useState<View>({ kind: 'list' })

  // Lock body horizontal scroll while the preview is open — paper at full
  // width can otherwise spawn rubberband scrolling on iOS.
  useEffect(() => {
    if (view.kind !== 'one') return
    const prev = document.body.style.overflowX
    document.body.style.overflowX = 'hidden'
    return () => {
      document.body.style.overflowX = prev
    }
  }, [view.kind])

  if (status === 'loading' && resumes.length === 0) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg text-text-primary">
        <BrandLoader size="lg" label="Loading" />
      </div>
    )
  }

  if (view.kind === 'one') {
    const r = resumes.find((x) => x.id === view.id)
    if (!r) {
      return (
        <ListShell
          email={user?.email ?? null}
          onSignOut={signOut}
          resumes={resumes}
          handle={handle}
          onOpen={(id) => setView({ kind: 'one', id })}
        />
      )
    }
    return <PreviewView resume={r} onBack={() => setView({ kind: 'list' })} />
  }

  return (
    <ListShell
      email={user?.email ?? null}
      onSignOut={signOut}
      resumes={resumes}
      handle={handle}
      onOpen={(id) => setView({ kind: 'one', id })}
    />
  )
}

function ListShell({
  email,
  onSignOut,
  resumes,
  handle,
  onOpen,
}: {
  email: string | null
  onSignOut: () => Promise<void>
  resumes: ResumeRow[]
  handle: string | null
  onOpen: (id: string) => void
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bg text-text-primary">
      <div className="hero-glow left-1/2 top-0 -translate-x-1/2" aria-hidden />
      <div className="hero-noise" aria-hidden />

      <header className="relative z-10 flex items-center justify-between px-5 pt-6">
        <div className="flex items-center gap-2">
          <BrandMark className="h-6 w-6" />
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-text-muted">
            Resumefolio
          </span>
        </div>
        {email && (
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Sign out"
            className="-mr-1 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </header>

      <section className="relative z-10 px-5 pt-10">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-accent">
          Your resumes
        </p>
        <h1 className="mt-2 font-display text-4xl leading-[1.05] tracking-tight">
          Tap to view.
        </h1>
        <p className="mt-3 max-w-sm text-sm text-text-secondary">
          Read-only on mobile. Open on a laptop to edit.
        </p>
      </section>

      <section className="relative z-10 mt-8 space-y-3 px-5 pb-24">
        {resumes.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface/40 p-6 text-center">
            <p className="font-display text-lg text-text-primary">No resumes yet</p>
            <p className="mt-1 text-sm text-text-secondary">
              Create your first one on a desktop, then come back here to view it.
            </p>
          </div>
        ) : (
          resumes.map((r) => (
            <ResumeListRow key={r.id} resume={r} handle={handle} onOpen={() => onOpen(r.id)} />
          ))
        )}
      </section>

      <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center pb-6">
        <span className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-border bg-bg-card/80 px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.18em] text-text-muted backdrop-blur">
          <Pencil className="h-3 w-3" />
          Editing on desktop
        </span>
      </footer>
    </div>
  )
}

function ResumeListRow({
  resume,
  handle,
  onOpen,
}: {
  resume: ResumeRow
  handle: string | null
  onOpen: () => void
}) {
  const templateId = getTemplate(resume.data.templateId).id
  const sharePill = (() => {
    if (resume.share_mode === 'live')
      return { label: 'Live', dotCls: 'bg-emerald-400', textCls: 'text-emerald-300' }
    if (resume.share_mode === 'snapshot')
      return { label: 'Snapshot', dotCls: 'bg-amber-400/70', textCls: 'text-amber-200' }
    return { label: 'Private', dotCls: 'bg-text-muted', textCls: 'text-text-muted' }
  })()
  void handle
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-4 rounded-xl border border-border bg-surface/40 p-3 text-left transition-colors hover:border-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
    >
      <span className="block h-[80px] w-[60px] shrink-0 overflow-hidden rounded-md shadow-md shadow-black/40">
        <TemplateThumbnail id={templateId} className="block h-full w-full" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-base text-text-primary">
          {resume.name}
        </span>
        <span className="mt-0.5 block text-xs text-text-muted">
          Edited {formatRelative(new Date(resume.updated_at))}
        </span>
        <span className={`mt-1.5 inline-flex items-center gap-1.5 text-[0.7rem] ${sharePill.textCls}`}>
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${sharePill.dotCls}`} />
          {sharePill.label}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-text-muted transition-colors group-hover:text-accent" />
    </button>
  )
}

function PreviewView({ resume, onBack }: { resume: ResumeRow; onBack: () => void }) {
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    if (downloading) return
    setDownloading(true)
    try {
      await downloadResumePdf(resume.data)
    } catch {
      toast.error('PDF export failed')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg text-text-primary">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-bg/85 px-3 py-2.5 backdrop-blur">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="min-w-0 flex-1 truncate font-display text-base">{resume.name}</span>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-background transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          <Download className="h-3.5 w-3.5" />
          {downloading ? 'Preparing…' : 'PDF'}
        </button>
      </header>

      <main className="px-3 py-4">
        <div className="rounded-xl border border-border bg-surface/30 p-2">
          <ResumePreview data={resume.data} showChrome={false} showPageBreaks={false} />
        </div>
        <p className="mt-4 text-center text-[0.7rem] uppercase tracking-[0.18em] text-text-muted">
          Read-only · open on desktop to edit
        </p>
      </main>
    </div>
  )
}

function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path
        d="M9 7 h9.5 l4.5 4.5 v13 a1.25 1.25 0 0 1 -1.25 1.25 h-12.75 a1.25 1.25 0 0 1 -1.25 -1.25 v-16.25 a1.25 1.25 0 0 1 1.25 -1.25 z"
        fill="none"
        stroke="#FF5A36"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M18.5 7 v4.5 h4.5" fill="none" stroke="#FF5A36" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="11.5" y1="15" x2="20.5" y2="15" stroke="#F0EDE6" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="11.5" y1="18.5" x2="18.25" y2="18.5" stroke="#F0EDE6" strokeWidth="1.3" strokeLinecap="round" strokeOpacity="0.6" />
      <line x1="11.5" y1="22" x2="20.5" y2="22" stroke="#F0EDE6" strokeWidth="1.3" strokeLinecap="round" strokeOpacity="0.6" />
    </svg>
  )
}

function formatRelative(date: Date): string {
  const diff = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000))
  if (diff < 60) return 'just now'
  const m = Math.round(diff / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 7) return `${d}d ago`
  return date.toLocaleDateString()
}
