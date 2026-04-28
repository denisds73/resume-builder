import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import {
  DEFAULT_TEMPLATE_ID,
  TEMPLATE_LIST,
  type TemplateId,
} from '@/resume/templates'

interface Props {
  value: TemplateId | undefined
  onChange: (id: TemplateId) => void
}

export default function TemplateSwitcher({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const activeId: TemplateId = value && TEMPLATE_LIST.some((t) => t.id === value) ? value : DEFAULT_TEMPLATE_ID
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-primary transition-colors hover:border-border-hover"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Template: ${active.name}`}
        title="Switch template"
      >
        <span className="font-medium">{active.name}</span>
        <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Resume templates"
          className="absolute right-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-xl border border-border bg-bg-card shadow-2xl"
        >
          <ul className="py-1">
            {TEMPLATE_LIST.map((t) => {
              const selected = t.id === activeId
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={selected}
                    onClick={() => {
                      onChange(t.id)
                      setOpen(false)
                    }}
                    className="flex w-full items-start gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent/10 focus-visible:bg-accent/10 focus-visible:outline-none"
                  >
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center text-accent">
                      {selected && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-text-primary">{t.name}</span>
                      <span className="mt-0.5 block text-xs leading-snug text-text-muted">
                        {t.description}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
