import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Plus, Copy, Pencil, Trash2, Check } from 'lucide-react'
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
  const ref = useRef<HTMLDivElement>(null)
  const active = resumes.find((r) => r.id === activeId) ?? resumes[0]

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
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
          className="absolute left-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-bg-card shadow-2xl"
        >
          <ul className="max-h-80 overflow-y-auto py-1">
            {resumes.map((r) => {
              const isActive = r.id === active.id
              return (
                <li key={r.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(r.id)
                      setOpen(false)
                    }}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-surface ${
                      isActive ? 'bg-surface' : ''
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${shareDot(r.share_mode)}`}
                    />
                    <span className="flex-1 truncate">{r.name}</span>
                    {/*
                      Meta tray (timestamp + active check). Fades out when
                      the row is hovered or keyboard-focused-within so the
                      action tray can take its place without shifting the
                      row's total width.
                    */}
                    <span className="flex items-center gap-2 transition-opacity duration-150 group-hover:opacity-0 group-focus-within:opacity-0">
                      <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-text-muted">
                        {relativeShort(r.updated_at)}
                      </span>
                      {isActive && <Check className="h-3.5 w-3.5 text-accent" />}
                    </span>
                  </button>

                  {/*
                    Action tray — rendered as a sibling to the row button
                    (no nested interactive elements), positioned over the
                    meta column on hover. pointer-events gated so a casual
                    row click never lands on a hidden icon.
                  */}
                  <div
                    className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
                  >
                    <RowAction
                      icon={<Pencil className="h-3.5 w-3.5" />}
                      label="Rename"
                      onClick={() => {
                        setOpen(false)
                        onRename(r.id)
                      }}
                    />
                    <RowAction
                      icon={<Copy className="h-3.5 w-3.5" />}
                      label="Duplicate"
                      onClick={() => {
                        setOpen(false)
                        onDuplicate(r.id)
                      }}
                    />
                    <RowAction
                      icon={<Trash2 className="h-3.5 w-3.5" />}
                      label="Delete"
                      danger
                      onClick={() => {
                        setOpen(false)
                        onDelete(r.id)
                      }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onNew()
            }}
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

function RowAction({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded transition-colors ${
        danger
          ? 'text-text-muted hover:bg-red-500/10 hover:text-red-400'
          : 'text-text-muted hover:bg-bg-elevated hover:text-text-primary'
      }`}
    >
      {icon}
    </button>
  )
}
