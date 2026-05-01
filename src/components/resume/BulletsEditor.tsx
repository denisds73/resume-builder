import { useEffect, useRef, useState } from 'react'
import { Plus, X, Tag } from 'lucide-react'
import { RichTextarea } from '@/components/ui'

// Recommended bullet length: keep punchy, under ~180 chars (≈ 2 lines on
// most templates at body size).
const BULLET_SOFT_MAX = 180

/**
 * Bullet list editor shared across Experience, Projects, and Education.
 * Keeps stable per-row keys via a ref so React's identity doesn't follow
 * indices when a middle row is deleted (which would cause focus and
 * uncontrolled caret position to jump to the wrong input).
 *
 * When `projects` + `onProjectsChange` are provided (Experience only), each
 * row gets a "+ Project" affordance that reveals a slim tag input above the
 * bullet text. The two arrays are kept index-aligned by the editor.
 */
export interface BulletsEditorProps {
  bullets: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  addLabel?: string
  /** Index-aligned with `bullets`. Pass to enable the per-bullet project tag. */
  projects?: string[]
  onProjectsChange?: (next: string[]) => void
}

export default function BulletsEditor({
  bullets,
  onChange,
  placeholder = 'Shipped feature X that achieved Y…',
  addLabel = 'Add bullet',
  projects,
  onProjectsChange,
}: BulletsEditorProps) {
  const projectsEnabled = Boolean(projects && onProjectsChange)
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null)
  const [projectOpenIdx, setProjectOpenIdx] = useState<number | null>(null)
  const projectInputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  useEffect(() => {
    if (projectOpenIdx === null) return
    const el = projectInputRefs.current[projectOpenIdx]
    if (el) el.focus()
  }, [projectOpenIdx])
  const keysRef = useRef<string[]>([])
  while (keysRef.current.length < bullets.length) {
    keysRef.current.push(crypto.randomUUID())
  }
  if (keysRef.current.length > bullets.length) {
    keysRef.current = keysRef.current.slice(0, bullets.length)
  }

  const projectAt = (i: number): string => projects?.[i] ?? ''

  const setBullet = (i: number, text: string) => {
    const next = [...bullets]
    next[i] = text
    onChange(next)
  }
  const setProject = (i: number, text: string) => {
    if (!onProjectsChange) return
    const next = [...(projects ?? [])]
    while (next.length <= i) next.push('')
    next[i] = text
    onProjectsChange(next)
  }
  const addBullet = () => {
    keysRef.current = [...keysRef.current, crypto.randomUUID()]
    onChange([...bullets, ''])
    if (onProjectsChange) onProjectsChange([...(projects ?? []), ''])
  }
  const removeBullet = (i: number) => {
    keysRef.current = keysRef.current.filter((_, n) => n !== i)
    onChange(bullets.filter((_, n) => n !== i))
    if (onProjectsChange && projects) {
      onProjectsChange(projects.filter((_, n) => n !== i))
    }
    setProjectOpenIdx(null)
  }

  return (
    <div className="space-y-2">
      {bullets.map((b, i) => {
        const len = b.length
        const over = len > BULLET_SOFT_MAX
        const showCount = focusedIdx === i || over
        const project = projectAt(i)
        const projectShown =
          projectsEnabled && (project.length > 0 || projectOpenIdx === i)
        return (
          <div key={keysRef.current[i]} className="flex gap-2">
            <span className="mt-2 text-text-muted" aria-hidden="true">
              •
            </span>
            <div className="flex-1 space-y-1.5">
              {projectShown && (
                <input
                  type="text"
                  ref={(el) => {
                    projectInputRefs.current[i] = el
                  }}
                  value={project}
                  onChange={(e) => setProject(i, e.target.value)}
                  onBlur={() => {
                    if (project.length === 0) setProjectOpenIdx(null)
                  }}
                  placeholder="Project name (optional)"
                  aria-label="Project name for this bullet"
                  className="w-full rounded-md border border-accent/40 bg-surface/60 px-2.5 py-1 text-sm font-medium text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent focus:shadow-[0_0_0_2px_rgba(255,90,54,0.12)]"
                />
              )}
              <div className="relative">
                <RichTextarea
                  inline
                  value={b}
                  onChange={(next) => setBullet(i, next)}
                  onFocus={() => setFocusedIdx(i)}
                  onBlur={() => setFocusedIdx((cur) => (cur === i ? null : cur))}
                  placeholder={placeholder}
                />
                {showCount && (
                  <span
                    className={`pointer-events-none absolute right-2 top-2 font-mono text-[0.65rem] ${
                      over ? 'text-amber-300' : 'text-text-muted'
                    }`}
                    aria-live="polite"
                  >
                    {len}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              {projectsEnabled && !projectShown && (
                <button
                  type="button"
                  onClick={() => setProjectOpenIdx(i)}
                  className="cursor-pointer rounded-lg p-2 text-text-muted transition-colors hover:bg-accent/10 hover:text-accent"
                  aria-label="Add project name to this bullet"
                  title="Tag this bullet with a project name"
                >
                  <Tag className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => removeBullet(i)}
                className="cursor-pointer rounded-lg p-2 text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
                aria-label="Remove bullet"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )
      })}
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
