import { ArrowLeft, ArrowRight } from 'lucide-react'
import { SECTIONS, getSectionIndex, type SectionKey } from './sections'

interface Props {
  active: SectionKey
  onNavigate: (key: SectionKey) => void
}

export default function SectionFooter({ active, onNavigate }: Props) {
  const i = getSectionIndex(active)
  const prev = i > 0 ? SECTIONS[i - 1] : null
  const next = i >= 0 && i < SECTIONS.length - 1 ? SECTIONS[i + 1] : null

  return (
    <footer className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-4">
      <button
        type="button"
        disabled={!prev}
        onClick={() => prev && onNavigate(prev.key)}
        aria-label={prev ? `Previous section: ${prev.label}` : 'No previous section'}
        className="group inline-flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-text-secondary transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-text-secondary"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5 group-disabled:transform-none" />
        <span className="flex flex-col items-start leading-tight">
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-text-muted">
            Previous
          </span>
          <span className="font-body text-sm">{prev?.label ?? '—'}</span>
        </span>
      </button>

      <button
        type="button"
        disabled={!next}
        onClick={() => next && onNavigate(next.key)}
        aria-label={next ? `Next section: ${next.label}` : 'No next section'}
        className={
          next
            ? 'group inline-flex cursor-pointer items-center gap-3 rounded-lg bg-accent px-4 py-2.5 text-right text-background transition-colors hover:bg-accent-hover'
            : 'group inline-flex cursor-not-allowed items-center gap-3 rounded-lg border border-border px-4 py-2.5 text-right text-text-muted opacity-60'
        }
      >
        <span className="flex flex-col items-end leading-tight">
          <span
            className={
              next
                ? 'font-mono text-[0.6rem] uppercase tracking-[0.22em] opacity-80'
                : 'font-mono text-[0.6rem] uppercase tracking-[0.22em] text-text-muted'
            }
          >
            Next
          </span>
          <span className="font-body text-sm font-medium">{next?.label ?? '—'}</span>
        </span>
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-disabled:transform-none" />
      </button>
    </footer>
  )
}
