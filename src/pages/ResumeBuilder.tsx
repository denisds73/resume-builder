import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, AlertCircle, CheckCircle2, Loader2, ChevronDown } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'
import { useResumes } from '@/hooks/useResumes'
import { useActiveResume } from '@/hooks/useActiveResume'
import PersonalInfoEditor from '@/components/resume/PersonalInfoEditor'
import SummaryEditor from '@/components/resume/SummaryEditor'
import ExperienceEditor from '@/components/resume/ExperienceEditor'
import EducationEditor from '@/components/resume/EducationEditor'
import SkillsEditor from '@/components/resume/SkillsEditor'
import ProjectsEditor from '@/components/resume/ProjectsEditor'
import CertificationsEditor from '@/components/resume/CertificationsEditor'
import ResumePreview from '@/components/resume/ResumePreview'
import ResumeDocument from '@/components/resume/ResumeDocument'
import SectionNav from '@/components/resume/SectionNav'
import SectionFooter from '@/components/resume/SectionFooter'
import {
  SECTIONS,
  getSectionIndex,
  isSectionComplete,
  isValidSection,
  type SectionKey,
} from '@/components/resume/sections'
import type { ResumeData } from '@/types/resume'
import { pdfFileName } from '@/lib/resumeFormat'
import { RESUME_PRINT_PAGE_STYLE } from '@/lib/resumePrintStyle'
import AuthBar from '@/components/AuthBar'
import ResumeSwitcher from '@/components/resume/ResumeSwitcher'
import NewResumeDialog from '@/components/resume/NewResumeDialog'
import ShareButton from '@/components/resume/ShareButton'
import SharePanel from '@/components/resume/SharePanel'
import { useProfile } from '@/hooks/useProfile'
import { slugify } from '@/lib/slug'
import type { ResumeRow } from '@/lib/supabase'

function relativeTime(from: Date | null, now: Date): string {
  if (!from) return ''
  const diff = Math.max(0, Math.round((now.getTime() - from.getTime()) / 1000))
  if (diff < 5) return 'just now'
  if (diff < 60) return `${diff}s ago`
  const mins = Math.round(diff / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return from.toLocaleString()
}

function renderActiveEditor(
  key: SectionKey,
  data: ResumeData,
  setData: (u: ResumeData | ((p: ResumeData) => ResumeData)) => void,
) {
  switch (key) {
    case 'personal':
      return (
        <PersonalInfoEditor
          value={data.personal}
          onChange={(personal) => setData((d) => ({ ...d, personal }))}
        />
      )
    case 'summary':
      return (
        <SummaryEditor
          value={data.summary}
          onChange={(summary) => setData((d) => ({ ...d, summary }))}
        />
      )
    case 'skills':
      return (
        <SkillsEditor
          value={data.skills}
          onChange={(skills) => setData((d) => ({ ...d, skills }))}
        />
      )
    case 'experience':
      return (
        <ExperienceEditor
          value={data.experience}
          onChange={(experience) => setData((d) => ({ ...d, experience }))}
        />
      )
    case 'projects':
      return (
        <ProjectsEditor
          value={data.projects}
          onChange={(projects) => setData((d) => ({ ...d, projects }))}
        />
      )
    case 'education':
      return (
        <EducationEditor
          value={data.education}
          onChange={(education) => setData((d) => ({ ...d, education }))}
        />
      )
    case 'certifications':
      return (
        <CertificationsEditor
          value={data.certifications}
          onChange={(certifications) => setData((d) => ({ ...d, certifications }))}
        />
      )
  }
}

export default function ResumeBuilder() {
  const { activeId, resumes, setActiveId, create, duplicate, rename, remove } = useResumes()
  const activeResume = useActiveResume(activeId)
  const { data, setData, status, lastSavedAt, signedIn } = activeResume
  const [newOpen, setNewOpen] = useState(false)
  const [duplicateFrom, setDuplicateFrom] = useState<ResumeRow | null>(null)
  const [renameTarget, setRenameTarget] = useState<ResumeRow | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<ResumeRow | null>(null)
  const { handle, claim: claimHandle } = useProfile()
  const [shareOpen, setShareOpen] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const printRef = useRef<HTMLDivElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)

  const [searchParams, setSearchParams] = useSearchParams()
  const sectionParam = searchParams.get('section')
  const active: SectionKey = isValidSection(sectionParam) ? sectionParam : 'personal'

  const setActive = useCallback(
    (key: SectionKey) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('section', key)
          return next
        },
        { replace: false },
      )
    },
    [setSearchParams],
  )

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      setCanScrollUp(scrollTop > 4)
      setCanScrollDown(scrollTop + clientHeight < scrollHeight - 4)
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    if (el.firstElementChild) ro.observe(el.firstElementChild)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [active])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      const t = e.target as HTMLElement | null
      if (
        t &&
        (t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA' ||
          t.isContentEditable)
      ) {
        return
      }
      const i = getSectionIndex(active)
      const candidate = e.key === 'ArrowLeft' ? SECTIONS[i - 1] : SECTIONS[i + 1]
      if (!candidate) return
      e.preventDefault()
      setActive(candidate.key)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, setActive])

  const completion = useMemo(
    () =>
      Object.fromEntries(
        SECTIONS.map((s) => [s.key, isSectionComplete(data, s.key)]),
      ) as Record<SectionKey, boolean>,
    [data],
  )

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: pdfFileName(data.personal).replace(/\.pdf$/, ''),
    pageStyle: RESUME_PRINT_PAGE_STYLE,
  })

  const statusChip = (() => {
    if (!signedIn) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs text-text-muted">
          Draft saved locally
        </span>
      )
    }
    if (status === 'loading') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs text-text-muted">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading…
        </span>
      )
    }
    if (status === 'saving') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/5 px-3 py-1 text-xs text-accent">
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving…
        </span>
      )
    }
    if (status === 'error') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/5 px-3 py-1 text-xs text-red-400">
          <AlertCircle className="h-3 w-3" />
          Save failed, stored locally
        </span>
      )
    }
    if (status === 'saved' && lastSavedAt) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs text-text-muted">
          <CheckCircle2 className="h-3 w-3 text-accent" />
          Saved {relativeTime(lastSavedAt, now)}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs text-text-muted">
        Draft
      </span>
    )
  })()

  return (
    <div className="mx-auto flex h-screen max-w-[1280px] flex-col overflow-hidden px-6 py-6">
      <header className="mb-6 flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-text-muted">
            Resumefolio
          </p>
          <h1 className="font-display text-3xl text-text-primary">Build your resume</h1>
          <div className="mt-3 flex items-center gap-2">{statusChip}</div>
          {signedIn && resumes.length > 0 && (
            <div className="mt-3">
              <ResumeSwitcher
                resumes={resumes}
                activeId={activeId}
                onSelect={setActiveId}
                onNew={() => setNewOpen(true)}
                onDuplicate={(id) => {
                  const src = resumes.find((r) => r.id === id)
                  if (src) setDuplicateFrom(src)
                }}
                onRename={(id) => {
                  const src = resumes.find((r) => r.id === id)
                  if (src) {
                    setRenameTarget(src)
                    setRenameValue(src.name)
                  }
                }}
                onDelete={(id) => {
                  const src = resumes.find((r) => r.id === id)
                  if (src) setDeleteTarget(src)
                }}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <AuthBar />
          {signedIn && activeId && (
            <ShareButton
              shareMode={activeResume.shareMode}
              onClick={() => setShareOpen(true)}
            />
          )}
          <button
            type="button"
            onClick={() => handlePrint()}
            disabled={status === 'loading'}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-accent px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(420px,520px)] xl:grid-rows-1 xl:gap-8">
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-surface/30">
          <div className="shrink-0">
            <SectionNav active={active} onSelect={setActive} completion={completion} />
          </div>
          <div className="relative min-h-0 flex-1">
            <div
              ref={scrollRef}
              role="tabpanel"
              id="resume-section-panel"
              aria-labelledby={`resume-tab-${active}`}
              className="h-full overflow-y-auto px-6 pt-6 pb-4"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.14, ease: 'easeOut' }}
                >
                  {renderActiveEditor(active, data, setData)}
                </motion.div>
              </AnimatePresence>
            </div>
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-surface to-transparent transition-opacity duration-200 ${
                canScrollUp ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface via-surface/80 to-transparent transition-opacity duration-200 ${
                canScrollDown ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <button
              type="button"
              aria-label="Scroll to see more fields"
              onClick={() => {
                scrollRef.current?.scrollBy({ top: 240, behavior: 'smooth' })
              }}
              className={`pointer-events-auto absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-background/90 px-3 py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-text-secondary shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-accent/40 hover:text-accent ${
                canScrollDown
                  ? 'translate-y-0 opacity-100'
                  : 'pointer-events-none translate-y-1 opacity-0'
              }`}
            >
              More fields
              <ChevronDown className="h-3 w-3 animate-bounce" />
            </button>
          </div>
          <div className="shrink-0 px-6 pb-6">
            <SectionFooter active={active} onNavigate={setActive} />
          </div>
        </div>
        <aside className="min-h-0 overflow-y-auto">
          <ResumePreview data={data} />
        </aside>
      </div>

      <NewResumeDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onSubmit={async ({ name, slug }) => {
          await create({ name, slug })
        }}
        title="New resume"
        submitLabel="Create"
        existingSlugs={resumes.map((r) => r.slug)}
      />

      <NewResumeDialog
        open={Boolean(duplicateFrom)}
        onClose={() => setDuplicateFrom(null)}
        onSubmit={async ({ name, slug }) => {
          if (duplicateFrom) await duplicate(duplicateFrom.id, name, slug)
        }}
        title="Duplicate resume"
        submitLabel="Duplicate"
        initialName={duplicateFrom ? `${duplicateFrom.name} (copy)` : ''}
        initialSlug={duplicateFrom ? slugify(`${duplicateFrom.slug}-copy`) : ''}
        existingSlugs={resumes.map((r) => r.slug)}
      />

      <SharePanel
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        handle={handle}
        onClaimHandle={claimHandle}
        slug={activeResume.slug}
        shareMode={activeResume.shareMode}
        onSetShareMode={activeResume.setShareMode}
        data={activeResume.data}
        publishedData={activeResume.publishedData}
        onPublish={activeResume.publish}
      />

      {renameTarget && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-24"
          onClick={() => setRenameTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-border bg-bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 font-display text-xl text-text-primary">Rename resume</h2>
            <label className="field-label" htmlFor="rename-input">Name</label>
            <input
              id="rename-input"
              className="field-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenameTarget(null)}
                className="rounded-lg px-4 py-2 text-sm text-text-secondary hover:bg-surface"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!renameValue.trim()}
                onClick={async () => {
                  await rename(renameTarget.id, renameValue.trim())
                  setRenameTarget(null)
                }}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-24"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-border bg-bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-2 font-display text-xl text-text-primary">
              Delete "{deleteTarget.name}"?
            </h2>
            <p className="mb-6 text-sm text-text-secondary">
              This can't be undone. Any public link will stop working immediately.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg px-4 py-2 text-sm text-text-secondary hover:bg-surface"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await remove(deleteTarget.id)
                  setDeleteTarget(null)
                }}
                className="rounded-lg bg-red-500/90 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-10000px',
          top: 0,
          width: '8.5in',
        }}
      >
        <div ref={printRef}>
          <ResumeDocument data={data} />
        </div>
      </div>
    </div>
  )
}
