import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Eye, ExternalLink, MoreHorizontal } from 'lucide-react'
import type { ResumeRow } from '@/lib/supabase'
import { getTemplate } from '@/resume/templates'
import { useDismiss } from '@/lib/useDismiss'
import TemplateThumbnail from './TemplateThumbnail'
import { MOTION } from '@/lib/motion'

export interface ResumeCardProps {
  resume: ResumeRow
  publicHandle: string | null
  onOpen: () => void
  onDuplicate: () => void
  onRename: () => void
  onDelete: () => void
}

export default function ResumeCard({
  resume,
  publicHandle,
  onOpen,
  onDuplicate,
  onRename,
  onDelete,
}: ResumeCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const templateId = getTemplate(resume.data.templateId).id

  useDismiss(menuOpen, () => setMenuOpen(false), menuRef)

  const sharePill = (() => {
    if (resume.share_mode === 'live')
      return { label: 'Live', dotCls: 'bg-emerald-400', textCls: 'text-emerald-300' }
    if (resume.share_mode === 'snapshot')
      return { label: 'Snapshot', dotCls: 'bg-amber-400/70', textCls: 'text-amber-200' }
    return { label: 'Private', dotCls: 'bg-text-muted', textCls: 'text-text-muted' }
  })()

  const updated = new Date(resume.updated_at)
  const publicHref =
    publicHandle && resume.share_mode !== 'off'
      ? `/@${publicHandle}/${resume.slug}`
      : null

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface/40 transition-colors hover:border-border-hover">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${resume.name}`}
        className="relative block aspect-[8.5/11] w-full overflow-hidden bg-bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      >
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="block w-[78%] overflow-hidden rounded-md shadow-lg shadow-black/40 transition-transform group-hover:scale-[1.02]">
            <TemplateThumbnail id={templateId} className="block h-full w-full" />
          </span>
        </span>
      </button>

      <div className="flex items-start justify-between gap-2 px-4 pt-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-base text-text-primary">{resume.name}</h3>
          <p className="mt-0.5 text-xs text-text-muted">
            Edited {formatRelative(updated)}
          </p>
        </div>
        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            aria-label="More actions"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="-mr-1 -mt-1 rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          <AnimatePresence>
          {menuOpen && (
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: MOTION.fast }}
              className="absolute right-0 top-full z-40 mt-2 w-44 overflow-hidden rounded-lg border border-border bg-bg-card shadow-lg shadow-black/40"
            >
              <MenuItem onClick={() => { setMenuOpen(false); onOpen() }}>Open</MenuItem>
              <MenuItem onClick={() => { setMenuOpen(false); onRename() }}>Rename</MenuItem>
              <MenuItem onClick={() => { setMenuOpen(false); onDuplicate() }}>Duplicate</MenuItem>
              <MenuItem
                onClick={() => { setMenuOpen(false); onDelete() }}
                tone="danger"
              >
                Delete
              </MenuItem>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 px-4 pb-4 pt-2">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 text-xs ${sharePill.textCls}`}>
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${sharePill.dotCls}`} />
            {sharePill.label}
          </span>
          {resume.view_count > 0 && (
            <span
              className="inline-flex items-center gap-1 text-xs text-text-muted"
              aria-label={`${resume.view_count} ${resume.view_count === 1 ? 'view' : 'views'}`}
              title={`${resume.view_count} ${resume.view_count === 1 ? 'view' : 'views'}`}
            >
              <Eye className="h-3 w-3" />
              <span className="tabular-nums">{formatCount(resume.view_count)}</span>
            </span>
          )}
        </div>
        {publicHref && (
          <Link
            to={publicHref}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-text-secondary transition-colors hover:text-accent"
          >
            View
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
    </article>
  )
}

function MenuItem({
  children,
  onClick,
  tone,
}: {
  children: React.ReactNode
  onClick: () => void
  tone?: 'danger'
}) {
  const cls =
    tone === 'danger'
      ? 'text-red-300 hover:bg-red-500/10 hover:text-red-200'
      : 'text-text-secondary hover:bg-surface hover:text-text-primary'
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`block w-full px-3 py-2 text-left text-sm transition-colors ${cls}`}
    >
      {children}
    </button>
  )
}

function formatCount(n: number): string {
  if (n < 1000) return String(n)
  if (n < 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  if (n < 1_000_000) return `${Math.round(n / 1000)}k`
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
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
