import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'
import { useResume, type UseResumeReturn } from '@/hooks/useResume'
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
  setData: UseResumeReturn['setData'],
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
  const { data, setData, status, lastSavedAt, signedIn } = useResume()
  const [now, setNow] = useState(() => new Date())
  const printRef = useRef<HTMLDivElement | null>(null)

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
    <div className="mx-auto max-w-[1280px] px-6 py-8">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-text-muted">
            Resume Builder
          </p>
          <h1 className="font-display text-3xl text-text-primary">Build your resume</h1>
          <div className="mt-3 flex items-center gap-2">{statusChip}</div>
        </div>
        <div className="flex items-center gap-3">
          <AuthBar />
          <button
            type="button"
            onClick={() => handlePrint()}
            disabled={status === 'loading'}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
        </div>
      </header>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(420px,520px)]">
        <div className="overflow-hidden rounded-xl border border-border bg-surface/30">
          <SectionNav active={active} onSelect={setActive} completion={completion} />
          <div
            role="tabpanel"
            id="resume-section-panel"
            aria-labelledby={`resume-tab-${active}`}
            className="min-h-[420px] p-6"
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
            <SectionFooter active={active} onNavigate={setActive} />
          </div>
        </div>
        <aside className="xl:sticky xl:top-8 xl:h-[calc(100vh-4rem)] xl:overflow-y-auto">
          <ResumePreview data={data} />
        </aside>
      </div>

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
