import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Check, Search } from 'lucide-react'
import {
  COUNTRY_CODES,
  formatPhone,
  parsePhone,
  type CountryCode,
} from '@/lib/countryCodes'
import { sanitizePhoneLocal } from '@/lib/validators'

export interface PhoneInputProps {
  label: string
  value: string
  onChange: (next: string) => void
  placeholder?: string
  helper?: string
  error?: string
  /** Matches the UI Input `name` contract so form wiring stays familiar. */
  name?: string
  /** Called after the user blurs the local-number input. */
  onBlur?: () => void
}

/**
 * Composite phone-entry control: a text-only country-code dropdown
 * (with typeahead) fused to a local-number input. Emits the canonical
 * combined string `"${code} ${local}"` via onChange. Parses incoming
 * values so existing resumes round-trip without edits.
 *
 * No flag emojis — identity is communicated through the dial code and
 * a small mono ISO chip in the dropdown. Text-first by design.
 */
export function PhoneInput({
  label,
  value,
  onChange,
  placeholder = '98765 43210',
  helper,
  error,
  name,
  onBlur,
}: PhoneInputProps) {
  const autoId = useId()
  const inputId = name ?? `phone-${autoId}`

  const parsed = useMemo(() => parsePhone(value), [value])
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    const t = window.setTimeout(() => searchRef.current?.focus(), 0)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      window.clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return COUNTRY_CODES
    return COUNTRY_CODES.filter((c) => {
      return (
        c.name.toLowerCase().includes(q) ||
        c.code.includes(q) ||
        c.iso.toLowerCase().includes(q)
      )
    })
  }, [query])

  function selectCountry(c: CountryCode) {
    onChange(formatPhone(c, parsed.local))
    setOpen(false)
  }

  function updateLocal(next: string) {
    // Live filter: letters and other junk never land in the stored value.
    // Users can still paste messy strings — we strip on the way in.
    onChange(formatPhone(parsed.country, sanitizePhoneLocal(next)))
  }

  const hasError = Boolean(error)

  return (
    <div ref={wrapperRef} className="relative">
      <label htmlFor={inputId} className="mb-1.5 block text-sm text-text-secondary">
        {label}
      </label>

      <div
        className={`flex items-stretch overflow-hidden rounded-lg border bg-surface transition-colors focus-within:border-accent ${
          hasError ? 'border-red-500/80' : 'border-border'
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Country code, currently ${parsed.country.name} ${parsed.country.code}`}
          className="inline-flex shrink-0 items-center gap-2 border-r border-border px-3.5 py-2.5 font-mono text-xs tracking-wide text-text-primary transition-colors hover:bg-surface-hover"
        >
          <span>{parsed.country.code}</span>
          <ChevronDown
            className={`h-3 w-3 text-text-muted transition-transform duration-200 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>

        <input
          id={inputId}
          name={name}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={parsed.local}
          onChange={(e) => updateLocal(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-4 py-2.5 text-text-primary outline-none placeholder:text-text-muted focus:outline-none focus-visible:outline-none"
        />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            aria-label="Country codes"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="absolute left-0 right-0 z-40 mt-2 overflow-hidden rounded-xl border border-border bg-bg-card shadow-2xl sm:max-w-sm"
          >
            <div className="flex items-center gap-2 border-b border-border px-3.5 py-2.5">
              <Search className="h-3.5 w-3.5 shrink-0 text-text-muted" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search country or code"
                className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted focus:outline-none focus-visible:outline-none"
              />
            </div>
            <ul className="max-h-64 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-3.5 py-2.5 text-xs text-text-muted">
                  No matches for "{query.trim()}"
                </li>
              ) : (
                filtered.map((c) => {
                  const selected = c.iso === parsed.country.iso
                  return (
                    <li key={c.iso}>
                      <button
                        type="button"
                        onClick={() => selectCountry(c)}
                        className={`flex w-full items-center gap-3 px-3.5 py-2 text-left text-sm transition-colors hover:bg-surface ${
                          selected ? 'bg-accent/5' : ''
                        }`}
                      >
                        <span
                          className={`flex-1 truncate ${
                            selected ? 'text-text-primary' : 'text-text-primary/90'
                          }`}
                        >
                          {c.name}
                        </span>
                        <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-text-muted">
                          {c.iso}
                        </span>
                        <span className="min-w-[2.75rem] text-right font-mono text-xs tracking-wide text-text-secondary">
                          {c.code}
                        </span>
                        <span className="flex h-3.5 w-3.5 items-center justify-center">
                          {selected && <Check className="h-3.5 w-3.5 text-accent" />}
                        </span>
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {error ? (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      ) : helper ? (
        <p className="mt-1 text-xs text-text-muted">{helper}</p>
      ) : null}
    </div>
  )
}
