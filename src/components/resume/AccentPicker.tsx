import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { ACCENT_PALETTE, getTemplate, type TemplateId } from '@/resume/templates'
import Tooltip from '@/components/Tooltip'

interface Props {
  templateId: TemplateId | undefined
  value: string | undefined
  onChange: (next: string | undefined) => void
}

/**
 * Per-resume accent customization. The "Default" entry returns to the
 * active template's own accent (which may itself be `null`); the
 * curated palette is intentionally narrow — six brand-cohesive shades
 * that read on white paper at body size.
 */
export default function AccentPicker({ templateId, value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

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

  const template = getTemplate(templateId)
  const templateDefault = template.htmlTokens.accentColor
  // Effective swatch shown in the trigger: user override wins, else
  // the template's own accent if any, else neutral.
  const effective = value ?? templateDefault ?? null
  const activeId = matchPaletteId(value)

  return (
    <div ref={ref} className="relative">
      <Tooltip content="Accent color">
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label="Accent color"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-text-primary transition-colors hover:border-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          <SwatchDot color={effective} />
          <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
        </button>
      </Tooltip>

      {open && (
        <div
          role="dialog"
          aria-label="Accent color"
          className="absolute right-0 top-full z-40 mt-2 w-60 rounded-xl border border-border bg-bg-card p-3 shadow-2xl"
        >
          <p className="mb-2 px-1 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-text-muted">
            Accent
          </p>
          <button
            type="button"
            onClick={() => {
              onChange(undefined)
              setOpen(false)
            }}
            className={`mb-2 flex w-full items-center justify-between rounded-md border px-2.5 py-2 text-left text-xs transition-colors ${
              !value
                ? 'border-accent/50 bg-accent/10 text-text-primary'
                : 'border-border bg-surface text-text-secondary hover:border-border-hover hover:text-text-primary'
            }`}
          >
            <span className="flex items-center gap-2">
              <SwatchDot color={templateDefault} muted={!templateDefault} />
              <span>
                <span className="block font-medium">Template default</span>
                <span className="block text-[0.7rem] text-text-muted">
                  {templateDefault ? `Uses ${template.name}'s accent` : 'No accent for this template'}
                </span>
              </span>
            </span>
            {!value && <Check className="h-3.5 w-3.5 text-accent" aria-hidden />}
          </button>
          <div role="radiogroup" aria-label="Custom accent" className="grid grid-cols-6 gap-2">
            {ACCENT_PALETTE.map((sw) => {
              const selected = activeId === sw.id
              return (
                <Tooltip key={sw.id} content={sw.label}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={sw.label}
                    onClick={() => {
                      onChange(sw.color)
                      setOpen(false)
                    }}
                    className={`relative flex h-8 w-8 items-center justify-center rounded-md border transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
                      selected ? 'border-accent ring-2 ring-accent/40' : 'border-border'
                    }`}
                    style={{ background: sw.color }}
                  >
                    {selected && <Check className="h-3.5 w-3.5 text-white drop-shadow" />}
                  </button>
                </Tooltip>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function SwatchDot({ color, muted }: { color: string | null | undefined; muted?: boolean }) {
  if (!color) {
    return (
      <span
        aria-hidden
        className={`inline-block h-3.5 w-3.5 rounded-full border border-border ${
          muted ? 'bg-bg-card' : 'bg-text-muted/30'
        }`}
      />
    )
  }
  return (
    <span
      aria-hidden
      className="inline-block h-3.5 w-3.5 rounded-full border border-black/30"
      style={{ background: color }}
    />
  )
}

function matchPaletteId(color: string | undefined): string | null {
  if (!color) return null
  const lower = color.toLowerCase()
  return ACCENT_PALETTE.find((s) => s.color.toLowerCase() === lower)?.id ?? 'custom'
}
