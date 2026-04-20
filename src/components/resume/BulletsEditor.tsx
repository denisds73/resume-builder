import { useRef } from 'react'
import { Plus, X } from 'lucide-react'

/**
 * Bullet list editor shared across Experience, Projects, and Education.
 * Keeps stable per-row keys via a ref so React's identity doesn't follow
 * indices when a middle row is deleted (which would cause focus and
 * uncontrolled caret position to jump to the wrong input).
 */
export interface BulletsEditorProps {
  bullets: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  addLabel?: string
}

export default function BulletsEditor({
  bullets,
  onChange,
  placeholder = 'Shipped feature X that achieved Y…',
  addLabel = 'Add bullet',
}: BulletsEditorProps) {
  const keysRef = useRef<string[]>([])
  while (keysRef.current.length < bullets.length) {
    keysRef.current.push(crypto.randomUUID())
  }
  if (keysRef.current.length > bullets.length) {
    keysRef.current = keysRef.current.slice(0, bullets.length)
  }

  const setBullet = (i: number, text: string) => {
    const next = [...bullets]
    next[i] = text
    onChange(next)
  }
  const addBullet = () => {
    keysRef.current = [...keysRef.current, crypto.randomUUID()]
    onChange([...bullets, ''])
  }
  const removeBullet = (i: number) => {
    keysRef.current = keysRef.current.filter((_, n) => n !== i)
    onChange(bullets.filter((_, n) => n !== i))
  }

  return (
    <div className="space-y-2">
      {bullets.map((b, i) => (
        <div key={keysRef.current[i]} className="flex gap-2">
          <span className="mt-2.5 text-text-muted" aria-hidden="true">
            •
          </span>
          <input
            value={b}
            onChange={(e) => setBullet(i, e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent focus:outline-none focus-visible:outline-none"
          />
          <button
            type="button"
            onClick={() => removeBullet(i)}
            className="cursor-pointer rounded-lg p-2 text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
            aria-label="Remove bullet"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addBullet}
        className="group inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent"
      >
        <Plus className="h-3 w-3 transition-transform group-hover:rotate-90" />
        {addLabel}
      </button>
    </div>
  )
}
