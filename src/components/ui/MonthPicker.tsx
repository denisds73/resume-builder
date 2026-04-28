import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface MonthPickerProps {
  label: string
  value: string | null
  onChange: (value: string | null) => void
  allowPresent?: boolean
  isPresent?: boolean
  onPresentChange?: (present: boolean) => void
}

export default function MonthPicker({
  label,
  value,
  onChange,
  allowPresent,
  isPresent,
  onPresentChange,
}: MonthPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Parse current value
  const parsed = value ? new Date(value + 'T00:00:00') : null
  const selectedYear = parsed?.getFullYear() ?? new Date().getFullYear()
  const selectedMonth = parsed?.getMonth() ?? null

  const [viewYear, setViewYear] = useState(selectedYear)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const handleSelect = (month: number) => {
    const m = String(month + 1).padStart(2, '0')
    onChange(`${viewYear}-${m}-01`)
    setOpen(false)
  }

  const displayValue = isPresent
    ? 'Present'
    : parsed
      ? `${MONTHS[parsed.getMonth()]} ${parsed.getFullYear()}`
      : ''

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()

  return (
    <div ref={ref} className="relative">
      <label className="mb-1.5 block text-sm font-medium text-text-secondary">{label}</label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => { if (!isPresent) setOpen(!open) }}
        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
          isPresent
            ? 'border-accent/30 bg-accent/5 text-accent cursor-default'
            : open
              ? 'border-accent bg-surface text-text-primary'
              : 'border-border bg-surface text-text-primary hover:border-border-hover cursor-pointer'
        }`}
      >
        <span className={displayValue ? '' : 'text-text-muted'}>
          {displayValue || 'Select month'}
        </span>
        <Calendar className="h-3.5 w-3.5 text-text-muted" />
      </button>

      {/* Present toggle */}
      {allowPresent && (
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={isPresent}
            aria-label="Currently working here"
            onClick={() => {
              const next = !isPresent
              onPresentChange?.(next)
              if (next) {
                onChange(null)
                setOpen(false)
              }
            }}
            className={`relative inline-block h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              isPresent ? 'bg-accent' : 'bg-border'
            }`}
          >
            <span
              aria-hidden="true"
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-text-primary transition-transform ${
                isPresent ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="text-xs text-text-muted">Currently working here</span>
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[280px] rounded-xl border border-border bg-surface p-4 shadow-xl shadow-black/30">
          {/* Year nav */}
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              className="cursor-pointer rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-body text-sm font-medium text-text-primary">{viewYear}</span>
            <button
              type="button"
              onClick={() => setViewYear((y) => Math.min(y + 1, currentYear))}
              disabled={viewYear >= currentYear}
              className="cursor-pointer rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-4 gap-1.5">
            {MONTHS.map((month, i) => {
              const isFuture = viewYear === currentYear && i > currentMonth
              const isSelected = selectedYear === viewYear && selectedMonth === i
              return (
                <button
                  key={month}
                  type="button"
                  disabled={isFuture}
                  onClick={() => handleSelect(i)}
                  className={`cursor-pointer rounded-lg px-2 py-2 text-center text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-accent text-bg'
                      : isFuture
                        ? 'cursor-not-allowed text-text-muted opacity-30'
                        : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                  }`}
                >
                  {month}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
