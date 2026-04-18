import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { SECTIONS, type SectionKey } from './sections'

interface Props {
  active: SectionKey
  onSelect: (key: SectionKey) => void
  completion: Record<SectionKey, boolean>
}

export default function SectionNav({ active, onSelect, completion }: Props) {
  const listRef = useRef<HTMLDivElement | null>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const current = SECTIONS.findIndex((s) => s.key === active)
    if (current === -1) return
    let nextIndex = current
    if (e.key === 'ArrowRight') nextIndex = Math.min(SECTIONS.length - 1, current + 1)
    else if (e.key === 'ArrowLeft') nextIndex = Math.max(0, current - 1)
    else if (e.key === 'Home') nextIndex = 0
    else if (e.key === 'End') nextIndex = SECTIONS.length - 1
    else return
    e.preventDefault()
    const next = SECTIONS[nextIndex]
    if (next.key === active) return
    onSelect(next.key)
    const el = listRef.current?.querySelector<HTMLButtonElement>(
      `[data-section-tab="${next.key}"]`,
    )
    el?.focus()
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-orientation="horizontal"
      aria-label="Resume sections"
      onKeyDown={handleKeyDown}
      className="flex items-end gap-1 overflow-x-auto border-b border-border px-2 [scrollbar-width:none] [scroll-snap-type:x_mandatory] [&::-webkit-scrollbar]:hidden"
    >
      {SECTIONS.map((s) => {
        const isActive = s.key === active
        return (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls="resume-section-panel"
            id={`resume-tab-${s.key}`}
            data-section-tab={s.key}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onSelect(s.key)}
            className={cn(
              'relative shrink-0 cursor-pointer px-4 py-3 text-left transition-colors',
              'flex flex-col items-start gap-0.5 snap-start outline-none focus-visible:ring-1 focus-visible:ring-accent',
              isActive
                ? '-mb-px border-b-2 border-accent text-accent'
                : 'border-b-2 border-transparent text-text-secondary hover:bg-surface/40 hover:text-text-primary',
            )}
          >
            <span
              className={cn(
                'font-mono text-[0.62rem] uppercase tracking-[0.22em]',
                isActive ? 'text-accent' : 'text-text-muted',
              )}
            >
              {s.kicker}
            </span>
            <span className="font-body text-sm">{s.label}</span>
            {completion[s.key] && (
              <span
                aria-hidden="true"
                className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent ring-2 ring-surface"
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
