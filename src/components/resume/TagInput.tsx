import { useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'

interface Props {
  label: string
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
}

export default function TagInput({ label, value, onChange, placeholder }: Props) {
  const [draft, setDraft] = useState('')

  const commit = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    if (value.includes(trimmed)) {
      setDraft('')
      return
    }
    onChange([...value, trimmed])
    setDraft('')
  }

  const remove = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Backspace' && !draft && value.length > 0) {
      e.preventDefault()
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm text-text-secondary">{label}</label>
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-surface px-2 py-2 focus-within:border-accent">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-xs text-text-primary"
          >
            {tag}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => remove(tag)}
              className="cursor-pointer text-text-muted hover:text-accent"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commit}
          placeholder={placeholder ?? 'Type and press Enter'}
          className="min-w-[120px] flex-1 bg-transparent px-1 py-1 text-sm text-text-primary outline-none placeholder:text-text-muted focus:outline-none focus-visible:outline-none"
        />
      </div>
    </div>
  )
}
