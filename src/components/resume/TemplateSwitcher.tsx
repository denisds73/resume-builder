import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  DEFAULT_TEMPLATE_ID,
  TEMPLATE_LIST,
  type TemplateId,
} from '@/resume/templates'
import { toast } from '@/lib/toast'
import TemplateCard from './TemplateCard'

interface Props {
  value: TemplateId | undefined
  onChange: (id: TemplateId) => void
}

export default function TemplateSwitcher({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const activeId: TemplateId =
    value && TEMPLATE_LIST.some((t) => t.id === value) ? value : DEFAULT_TEMPLATE_ID
  const active = TEMPLATE_LIST.find((t) => t.id === activeId) ?? TEMPLATE_LIST[0]

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

  function pick(id: TemplateId) {
    if (id !== activeId) {
      onChange(id)
      const next = TEMPLATE_LIST.find((t) => t.id === id)
      if (next) toast.success(`Switched to ${next.name}`)
    }
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-primary transition-colors hover:border-border-hover"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Template: ${active.name}`}
        title="Switch template"
      >
        <span className="font-medium">{active.name}</span>
        <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Resume templates"
          className="absolute right-0 top-full z-40 mt-2 rounded-xl border border-border bg-bg-card p-3 shadow-2xl"
        >
          <div role="radiogroup" aria-label="Template" className="flex items-stretch gap-2">
            {TEMPLATE_LIST.map((t) => (
              <TemplateCard
                key={t.id}
                id={t.id}
                name={t.name}
                selected={t.id === activeId}
                onClick={() => pick(t.id)}
              />
            ))}
          </div>
          <p className="mt-2 px-1 text-[0.7rem] text-text-muted">
            {active.description}
          </p>
        </div>
      )}
    </div>
  )
}
