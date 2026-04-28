import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, AlertCircle, CheckCircle2, ChevronDown, Undo2, Redo2, Settings as SettingsIcon } from 'lucide-react'
import BrandLoader from '../components/BrandLoader'
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
import SectionNav from '@/components/resume/SectionNav'
import SectionFooter from '@/components/resume/SectionFooter'
import {
  SECTIONS,
  getSectionIndex,
  isSectionComplete,
  isValidSection,
  type SectionKey,
} from '@/components/resume/sections'
import { emptyResume, type ResumeData } from '@/types/resume'
import { downloadResumePdf } from '@/pdf/download'
import AuthBar from '@/components/AuthBar'
import ResumeSwitcher from '@/components/resume/ResumeSwitcher'
import TemplateSwitcher from '@/components/resume/TemplateSwitcher'
import type { TemplateId } from '@/resume/templates'
import NewResumeDialog from '@/components/resume/NewResumeDialog'
import ShareButton from '@/components/resume/ShareButton'
import SharePanel from '@/components/resume/SharePanel'
import { useProfile } from '@/hooks/useProfile'
import { slugify } from '@/lib/slug'
import { toast } from '@/lib/toast'
import ConfirmDialog from '@/components/ConfirmDialog'
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
  const { data, setData, status, lastSavedAt, signedIn, undo, redo, canUndo, canRedo, commitHistory } = activeResume
  const [newOpen, setNewOpen] = useState(false)
  const [duplicateFrom, setDuplicateFrom] = useState<ResumeRow | null>(null)
  const [renameTarget, setRenameTarget] = useState<ResumeRow | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<ResumeRow | null>(null)
  const { handle, defaultTemplate, claim: claimHandle } = useProfile()
  const [shareOpen, setShareOpen] = useState(false)
  const [now, setNow] = useState(() => new Date())
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

      // Undo / redo — takes over for both inputs and document scope because
      // our coalesced history better matches how users reason about edits
      // than per-character native input undo.
      const isUndo = (e.key === 'z' || e.key === 'Z') && !e.shiftKey
      const isRedoShiftZ = (e.key === 'z' || e.key === 'Z') && e.shiftKey
      const isRedoY = e.key === 'y' || e.key === 'Y'
      if (isUndo || isRedoShiftZ || isRedoY) {
        const t = e.target as HTMLElement | null
        // Ignore when a modal dialog is open (sign-in, rename, etc.) — those
        // own their own forms, and we should not rewrite the resume behind
        // the user's back while they type in an unrelated field.
        if (t && t.closest('[role="dialog"]')) return
        e.preventDefault()
        if (isUndo) undo()
        else redo()
        return
      }

      // Existing section navigation.
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
  }, [active, setActive, undo, redo])

  // Flush a coalesced pending edit when focus moves to a different field so
  // each field-level edit becomes its own history entry.
  useEffect(() => {
    const onFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
        return
      }
      commitHistory()
    }
    document.addEventListener('focusout', onFocusOut)
    return () => document.removeEventListener('focusout', onFocusOut)
  }, [commitHistory])

  const completion = useMemo(
    () =>
      Object.fromEntries(
        SECTIONS.map((s) => [s.key, isSectionComplete(data, s.key)]),
      ) as Record<SectionKey, boolean>,
    [data],
  )

  const [downloading, setDownloading] = useState(false)
  const handleDownload = useCallback(async () => {
    if (downloading) return
    setDownloading(true)
    try {
      await downloadResumePdf(data)
    } finally {
      setDownloading(false)
    }
  }, [data, downloading])

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
          <BrandLoader size="sm" label="Loading" />
          Loading…
        </span>
      )
    }
    if (status === 'saving') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/5 px-3 py-1 text-xs text-accent">
          <BrandLoader size="sm" label="Saving" />
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
          <div className="inline-flex items-stretch overflow-hidden rounded-lg border border-border bg-surface">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              title={`Undo  ${navigator.platform.includes('Mac') ? '⌘Z' : 'Ctrl+Z'}`}
              aria-label="Undo"
              className="group inline-flex h-8 w-9 cursor-pointer items-center justify-center text-text-secondary transition-colors duration-150 hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/60 active:bg-accent/15 disabled:cursor-not-allowed disabled:text-text-muted disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-muted"
            >
              <Undo2 className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-[2px] group-active:-translate-x-[3px] group-disabled:!translate-x-0" />
            </button>
            <span aria-hidden className="w-px bg-border" />
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              title={`Redo  ${navigator.platform.includes('Mac') ? '⇧⌘Z' : 'Ctrl+Shift+Z'}`}
              aria-label="Redo"
              className="group inline-flex h-8 w-9 cursor-pointer items-center justify-center text-text-secondary transition-colors duration-150 hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/60 active:bg-accent/15 disabled:cursor-not-allowed disabled:text-text-muted disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-muted"
            >
              <Redo2 className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-[2px] group-active:translate-x-[3px] group-disabled:!translate-x-0" />
            </button>
          </div>
          <TemplateSwitcher
            value={data.templateId}
            onChange={(id: TemplateId) =>
              setData((d) => ({ ...d, templateId: id }))
            }
          />
          <AuthBar />
          {signedIn && (
            <Link
              to="/settings"
              aria-label="Settings"
              title="Settings"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              <SettingsIcon className="h-4 w-4" />
            </Link>
          )}
          {signedIn && activeId && (
            <ShareButton
              shareMode={activeResume.shareMode}
              onClick={() => setShareOpen(true)}
            />
          )}
          <button
            type="button"
            onClick={handleDownload}
            disabled={status === 'loading' || downloading}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-accent px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {downloading ? 'Preparing…' : 'Download PDF'}
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
        onSubmit={async ({ name, slug, templateId }) => {
          try {
            await create({ name, slug, data: { ...emptyResume(), templateId } })
            toast.success(`Created "${name}"`)
          } catch {
            toast.error('Could not create resume')
          }
        }}
        title="New resume"
        submitLabel="Create"
        initialTemplateId={defaultTemplate ?? 'classic'}
        existingSlugs={resumes.map((r) => r.slug)}
      />

      <NewResumeDialog
        open={Boolean(duplicateFrom)}
        onClose={() => setDuplicateFrom(null)}
        onSubmit={async ({ name, slug }) => {
          // Duplicate inherits the source template; picker is hidden via
          // omitted initialTemplateId, so templateId from the dialog is unused.
          if (!duplicateFrom) return
          try {
            await duplicate(duplicateFrom.id, name, slug)
            toast.success(`Duplicated to "${name}"`)
          } catch {
            toast.error('Could not duplicate resume')
          }
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
                  const next = renameValue.trim()
                  try {
                    await rename(renameTarget.id, next)
                    toast.success('Renamed')
                  } catch {
                    toast.error('Could not rename resume')
                  }
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

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={deleteTarget ? `Delete "${deleteTarget.name}"?` : 'Delete resume?'}
        description="This can't be undone. Any public link will stop working immediately."
        confirmText="delete"
        confirmLabel="Delete resume"
        onConfirm={async () => {
          if (!deleteTarget) return
          const name = deleteTarget.name
          try {
            await remove(deleteTarget.id)
            toast.success(`Deleted "${name}"`)
          } catch {
            toast.error('Could not delete resume')
          }
        }}
      />
    </div>
  )
}
