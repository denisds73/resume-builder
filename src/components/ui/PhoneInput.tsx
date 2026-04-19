import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ChevronDown, Check, Search } from 'lucide-react'
import {
  COUNTRY_CODES,
  formatPhone,
  parsePhone,
  type CountryCode,
} from '@/lib/countryCodes'

export interface PhoneInputProps {
  label: string
  value: string
  onChange: (next: string) => void
  placeholder?: string
  helper?: string
  error?: string
  /** Matches the UI Input `name` contract so form wiring stays familiar. */
  name?: string
}

/**
 * Composite phone-entry control: a country-code dropdown (with typeahead
 * search) fused to a local-number input. Emits the canonical combined
 * string `"${code} ${local}"` via onChange. Parses incoming values so
 * existing resumes round-trip without edits.
 */
export function PhoneInput({
  label,
  value,
  onChange,
  placeholder = '98765 43210',
  helper,
  error,
  name,
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
    // Focus the search input a frame after open so the positioning is settled
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
    onChange(formatPhone(parsed.country, next))
  }

  const hasError = Boolean(error)

  return (
    <div ref={wrapperRef}>
      <label htmlFor={inputId} className="mb-1.5 block text-sm text-text-secondary">
        {label}
      </label>

      <div
        className={`relative flex items-stretch overflow-hidden rounded-lg border bg-surface transition-colors focus-within:border-accent ${
          hasError ? 'border-red-500/80' : 'border-border'
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Country code, currently ${parsed.country.name} ${parsed.country.code}`}
          className="inline-flex shrink-0 items-center gap-1.5 border-r border-border bg-surface px-3 py-2.5 text-sm text-text-primary transition-colors hover:bg-surface-hover"
        >
          <span className="text-base leading-none" aria-hidden="true">
            {parsed.country.flag}
          </span>
          <span className="font-mono text-xs text-text-secondary">{parsed.country.code}</span>
          <ChevronDown
            className={`h-3 w-3 text-text-muted transition-transform ${
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
          placeholder={placeholder}
          className="flex-1 bg-transparent px-4 py-2.5 text-text-primary outline-none placeholder:text-text-muted"
        />
      </div>

      {open && (
        <div
          role="listbox"
          aria-label="Country codes"
          className="absolute z-40 mt-1 w-72 overflow-hidden rounded-xl border border-border bg-bg-card shadow-2xl"
        >
          <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-2">
            <Search className="h-3.5 w-3.5 text-text-muted" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country or code"
              className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-text-muted">No matches</li>
            ) : (
              filtered.map((c) => {
                const selected = c.iso === parsed.country.iso
                return (
                  <li key={c.iso}>
                    <button
                      type="button"
                      onClick={() => selectCountry(c)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-surface ${
                        selected ? 'bg-surface' : ''
                      }`}
                    >
                      <span className="text-base leading-none" aria-hidden="true">
                        {c.flag}
                      </span>
                      <span className="flex-1 truncate text-text-primary">{c.name}</span>
                      <span className="font-mono text-xs text-text-muted">{c.code}</span>
                      {selected && <Check className="h-3.5 w-3.5 text-accent" />}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}

      {error ? (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      ) : helper ? (
        <p className="mt-1 text-xs text-text-muted">{helper}</p>
      ) : null}
    </div>
  )
}
