import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Download, Loader2 } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'
import ResumePreview from '@/components/resume/ResumePreview'
import ResumeDocument from '@/components/resume/ResumeDocument'
import PublicResumeActions from '@/components/resume/PublicResumeActions'
import { fetchPublicResume } from '@/lib/publicResume'
import { pdfFileName } from '@/lib/resumeFormat'
import { RESUME_PRINT_PAGE_STYLE } from '@/lib/resumePrintStyle'
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
  const printRef = useRef<HTMLDivElement | null>(null)

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
      else setState({
        kind: 'ready',
        data: { ...emptyResume(), ...row.data },
        name: row.name,
      })
    })
    return () => { active = false }
  }, [handle, slug])

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle:
      state.kind === 'ready'
        ? pdfFileName(state.data.personal).replace(/\.pdf$/, '')
        : 'resume',
    pageStyle: RESUME_PRINT_PAGE_STYLE,
  })

  if (state.kind === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-text-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
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
            onClick={() => handlePrint()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-accent-hover"
          >
            <Download className="h-4 w-4" />
            Download PDF
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

      <div
        aria-hidden="true"
        style={{ position: 'fixed', left: '-10000px', top: 0, width: '8.5in' }}
      >
        <div ref={printRef}>
          <ResumeDocument data={state.data} />
        </div>
      </div>
    </div>
  )
}
