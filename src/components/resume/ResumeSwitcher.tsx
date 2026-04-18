import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Plus, MoreVertical, Copy, Pencil, Trash2, Check } from 'lucide-react'
import type { ResumeRow } from '@/lib/supabase'

export interface ResumeSwitcherProps {
  resumes: ResumeRow[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDuplicate: (id: string) => void
  onRename: (id: string) => void
  onDelete: (id: string) => void
}

function relativeShort(from: string): string {
  const diff = Math.max(0, Date.now() - new Date(from).getTime()) / 1000
  if (diff < 60) return 'now'
  const mins = Math.round(diff / 60)
  if (mins < 60) return `${mins}m`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.round(hrs / 24)
  return `${days}d`
}

function shareDot(mode: ResumeRow['share_mode']) {
  if (mode === 'live') return 'bg-accent'
  if (mode === 'snapshot') return 'bg-accent/50'
  return 'bg-border'
}

export default function ResumeSwitcher({
  resumes,
  activeId,
  onSelect,
  onNew,
  onDuplicate,
  onRename,
  onDelete,
}: ResumeSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [kebabId, setKebabId] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const active = resumes.find((r) => r.id === activeId) ?? resumes[0]

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setKebabId(null)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setKebabId(null)
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!active) return null

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-primary transition-colors hover:border-border-hover"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${shareDot(active.share_mode)}`} />
        <span className="font-medium">{active.name}</span>
        <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-xl border border-border bg-bg-card shadow-xl"
        >
          <ul className="max-h-80 overflow-y-auto py-1">
            {resumes.map((r) => {
              const isActive = r.id === active.id
              return (
                <li key={r.id} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(r.id)
                      setOpen(false)
                    }}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-surface ${isActive ? 'bg-surface' : ''}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${shareDot(r.share_mode)}`} />
                    <span className="flex-1 truncate">{r.name}</span>
                    <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-text-muted">
                      {relativeShort(r.updated_at)}
                    </span>
                    {isActive && <Check className="h-3.5 w-3.5 text-accent" />}
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label="Resume options"
                      onClick={(e) => {
                        e.stopPropagation()
                        setKebabId((k) => (k === r.id ? null : r.id))
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          e.stopPropagation()
                          setKebabId((k) => (k === r.id ? null : r.id))
                        }
                      }}
                      className="ml-1 rounded p-1 text-text-muted hover:bg-bg-elevated"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </span>
                  </button>
                  {kebabId === r.id && (
                    <div
                      role="menu"
                      className="absolute right-2 top-10 z-50 w-44 overflow-hidden rounded-lg border border-border bg-bg-elevated shadow-xl"
                    >
                      <button
                        type="button"
                        onClick={() => { setKebabId(null); setOpen(false); onRename(r.id) }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-surface"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => { setKebabId(null); setOpen(false); onDuplicate(r.id) }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-surface"
                      >
                        <Copy className="h-3.5 w-3.5" /> Duplicate
                      </button>
                      <button
                        type="button"
                        onClick={() => { setKebabId(null); setOpen(false); onDelete(r.id) }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-surface"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
          <button
            type="button"
            onClick={() => { setOpen(false); onNew() }}
            className="flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-sm text-accent transition-colors hover:bg-surface"
          >
            <Plus className="h-3.5 w-3.5" />
            New resume
          </button>
        </div>
      )}
    </div>
  )
}
