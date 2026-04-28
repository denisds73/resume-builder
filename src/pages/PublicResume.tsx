import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Download } from 'lucide-react'
import BrandLoader from '../components/BrandLoader'
import ResumePreview from '@/components/resume/ResumePreview'
import PublicResumeActions from '@/components/resume/PublicResumeActions'
import { fetchPublicResume, recordResumeView } from '@/lib/publicResume'
import { downloadResumePdf } from '@/pdf/download'
import { emptyResume, type ResumeData } from '@/types/resume'

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; data: ResumeData; name: string }
  | { kind: 'not-found' }

export default function PublicResume() {
  // The first path segment is captured as `handleSegment`. Valid public URLs
  // look like `/@denis/resume` so we expect the segment to begin with `@`.
  // Anything else (e.g. `/foo/bar`) falls through to the 404 view.
  const { handleSegment, slug } = useParams<{ handleSegment: string; slug: string }>()
  const handle = handleSegment?.startsWith('@') ? handleSegment.slice(1) : null
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [pages, setPages] = useState(1)
  const [downloading, setDownloading] = useState(false)

  // Stable callback so ResumePreview's effect doesn't re-fire on every render.
  const handlePagesChange = useCallback((p: number) => setPages(p), [])

  useEffect(() => {
    // Set noindex on the public view by default (v1 — no opt-in)
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => {
      document.head.removeChild(meta)
    }
  }, [])

  useEffect(() => {
    if (!handle || !slug) {
      setState({ kind: 'not-found' })
      return
    }
    let active = true
    fetchPublicResume(handle, slug).then((row) => {
      if (!active) return
      if (!row) setState({ kind: 'not-found' })
      else {
        setState({
          kind: 'ready',
          data: { ...emptyResume(), ...row.data },
          name: row.name,
        })
        void recordResumeView(handle, slug)
      }
    })
    return () => { active = false }
  }, [handle, slug])

  // Per-resume <head> updates so in-app navigation, history, and any
  // JS-aware scrapers see a personalised title and OG card. Crawlers that
  // only read the initial HTML still get the site-level defaults from
  // index.html — same image, generic copy. Per-crawler personalisation
  // would require a serverless rendering layer (separate PR).
  useEffect(() => {
    if (state.kind !== 'ready') return
    const personal = state.data.personal
    const fullName = [personal.firstName, personal.lastName].filter(Boolean).join(' ').trim()
    const title = fullName
      ? `${fullName}${personal.title ? ` — ${personal.title}` : ''} · Resumefolio`
      : `${state.name} · Resumefolio`
    const description = personal.title
      ? `${fullName || state.name}, ${personal.title}. View their resume on Resumefolio.`
      : `${fullName || state.name}'s resume on Resumefolio.`

    const prevTitle = document.title
    document.title = title
    const updates: Array<['name' | 'property', string, string]> = [
      ['name', 'description', description],
      ['property', 'og:title', title],
      ['property', 'og:description', description],
      ['property', 'og:url', window.location.href],
      ['name', 'twitter:title', title],
      ['name', 'twitter:description', description],
    ]
    const restore: Array<() => void> = []
    for (const [attr, key, value] of updates) {
      const sel = `meta[${attr}="${key}"]`
      const el = document.head.querySelector<HTMLMetaElement>(sel)
      if (!el) continue
      const before = el.content
      el.content = value
      restore.push(() => {
        el.content = before
      })
    }
    return () => {
      document.title = prevTitle
      for (const fn of restore) fn()
    }
  }, [state])

  const handleDownload = useCallback(async () => {
    if (state.kind !== 'ready' || downloading) return
    setDownloading(true)
    try {
      await downloadResumePdf(state.data)
    } finally {
      setDownloading(false)
    }
  }, [state, downloading])

  if (state.kind === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-text-muted">
        <BrandLoader size="lg" />
      </div>
    )
  }

  if (state.kind === 'not-found') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 py-10 text-center">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-accent">
          404
        </p>
        <h1 className="font-display text-3xl text-text-primary">Resume not found</h1>
        <p className="max-w-sm text-sm text-text-secondary">
          This link may have been removed, renamed, or never existed. If someone
          shared it with you, ask them for the current URL.
        </p>
        <a
          href="/"
          className="mt-3 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-text-muted hover:text-text-primary"
        >
          Resumefolio →
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-6 py-3 backdrop-blur">
        <a
          href="/"
          className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-text-muted transition-colors hover:text-text-primary"
        >
          Resumefolio
        </a>
        <div className="flex items-center gap-3">
          {pages > 1 && (
            <span
              aria-label={`${pages} pages when printed`}
              className="hidden font-mono text-[0.6rem] uppercase tracking-[0.22em] text-text-muted sm:inline-block"
            >
              {pages} pages
            </span>
          )}
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {downloading ? 'Preparing…' : 'Download PDF'}
          </button>
        </div>
      </header>

      <PublicResumeActions personal={state.data.personal} />

      <main className="mx-auto max-w-[820px] px-4 py-10">
        <ResumePreview
          data={state.data}
          showPageBreaks={false}
          showChrome={false}
          onPagesChange={handlePagesChange}
        />
      </main>

      {/*
        Mobile: keep attribution in document flow — the recruiter reaches
        it naturally at the end of the scroll. Stacking another sticky
        strip above the bottom action bar would crowd a phone viewport.
      */}
      <footer className="px-6 pb-10 pt-6 text-center lg:hidden">
        <a
          href="/"
          className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-text-muted transition-colors hover:text-text-primary"
        >
          Made with Resumefolio
        </a>
      </footer>

      {/*
        Desktop: fixed bottom-right watermark. Completes a three-corner
        sticky composition — brand/PDF top, contact rail mid-left, this
        attribution bottom-right. Quiet and signature-like; doesn't
        compete with the resume content column.
      */}
      <a
        href="/"
        className="fixed bottom-4 right-6 z-30 hidden font-mono text-[0.6rem] uppercase tracking-[0.22em] text-text-muted transition-colors hover:text-text-primary lg:inline-block"
      >
        Made with Resumefolio
      </a>
    </div>
  )
}
