import { useEffect, useRef, useState } from 'react'
import { Plus, Tag, X } from 'lucide-react'
import { RichTextarea } from '@/components/ui'

const BULLET_SOFT_MAX = 180

/**
 * Bullet list editor shared across Experience, Projects, and Education.
 * Keeps stable per-row keys via a ref so React's identity doesn't follow
 * indices when a middle row is deleted (which would cause focus and
 * uncontrolled caret position to jump to the wrong input).
 *
 * When `projects` + `onProjectsChange` are provided, each row exposes an
 * optional project tag (icon button + slim inline input) that is kept
 * index-aligned with the bullets array.
 */
export interface BulletsEditorProps {
  bullets: string[]
  /** Receives the next bullets array; when project tags are enabled, also
   * receives the next index-aligned projects array in the second arg. */
  onChange: (nextBullets: string[], nextProjects?: string[]) => void
  placeholder?: string
  addLabel?: string
  /** When provided, enables a per-row optional project tag affordance. */
  projects?: string[]
}

export default function BulletsEditor({
  bullets,
  onChange,
  placeholder = 'Shipped feature X that achieved Y…',
  addLabel = 'Add bullet',
  projects,
}: BulletsEditorProps) {
  const projectsEnabled = projects !== undefined
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null)
  const [revealedTagIdx, setRevealedTagIdx] = useState<Set<number>>(new Set())
  const projectInputRefs = useRef<Array<HTMLInputElement | null>>([])
  const focusOnMountIdx = useRef<number | null>(null)
  const keysRef = useRef<string[]>([])
  while (keysRef.current.length < bullets.length) {
    keysRef.current.push(crypto.randomUUID())
  }
  if (keysRef.current.length > bullets.length) {
    keysRef.current = keysRef.current.slice(0, bullets.length)
  }

  const projectAt = (i: number) => projects?.[i] ?? ''
  const projectsPadded = (): string[] => {
    if (!projectsEnabled) return []
    const next = [...(projects ?? [])]
    while (next.length < bullets.length) next.push('')
    return next.slice(0, bullets.length)
  }

  const setBullet = (i: number, text: string) => {
    const next = [...bullets]
    next[i] = text
    onChange(next, projectsEnabled ? projectsPadded() : undefined)
  }
  const setProject = (i: number, text: string) => {
    if (!projectsEnabled) return
    const next = projectsPadded()
    next[i] = text
    onChange(bullets, next)
  }
  const addBullet = () => {
    keysRef.current = [...keysRef.current, crypto.randomUUID()]
    onChange(
      [...bullets, ''],
      projectsEnabled ? [...projectsPadded(), ''] : undefined,
    )
  }
  const removeBullet = (i: number) => {
    keysRef.current = keysRef.current.filter((_, n) => n !== i)
    let nextProjects: string[] | undefined
    if (projectsEnabled) {
      nextProjects = projectsPadded()
      nextProjects.splice(i, 1)
    }
    onChange(
      bullets.filter((_, n) => n !== i),
      nextProjects,
    )
    setRevealedTagIdx((prev) => {
      const next = new Set<number>()
      prev.forEach((idx) => {
        if (idx === i) return
        next.add(idx > i ? idx - 1 : idx)
      })
      return next
    })
  }
  const toggleTag = (i: number) => {
    setRevealedTagIdx((prev) => {
      const next = new Set(prev)
      if (next.has(i)) {
        if (!projectAt(i).trim()) next.delete(i)
      } else {
        next.add(i)
        focusOnMountIdx.current = i
      }
      return next
    })
  }

  useEffect(() => {
    if (focusOnMountIdx.current === null) return
    const el = projectInputRefs.current[focusOnMountIdx.current]
    focusOnMountIdx.current = null
    el?.focus()
  })

  return (
    <div className="space-y-2">
      {bullets.map((b, i) => {
        const len = b.length
        const over = len > BULLET_SOFT_MAX
        const showCount = focusedIdx === i || over
        const projectVal = projectAt(i)
        const tagActive = projectVal.trim().length > 0
        const showTagInput =
          projectsEnabled && (tagActive || revealedTagIdx.has(i))
        return (
          <div key={keysRef.current[i]} className="space-y-1.5">
            <div className="flex gap-2">
              <span className="mt-2 text-text-muted" aria-hidden="true">
                •
              </span>
              <div className="relative flex-1">
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
              {projectsEnabled && (
                <button
                  type="button"
                  onClick={() => toggleTag(i)}
                  className={`cursor-pointer rounded-lg p-2 transition-colors ${
                    tagActive
                      ? 'text-accent hover:bg-accent/10'
                      : 'text-text-muted hover:bg-bg-card hover:text-text-secondary'
                  }`}
                  aria-label={
                    tagActive ? 'Edit project tag' : 'Add project tag (optional)'
                  }
                  aria-pressed={showTagInput}
                  title="Tag this bullet with a project"
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
            {showTagInput && (
              <div className="flex items-center gap-2 pl-[1.1rem]">
                <span
                  className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-text-muted"
                  aria-hidden="true"
                >
                  Project
                </span>
                <input
                  ref={(el) => {
                    projectInputRefs.current[i] = el
                  }}
                  type="text"
                  value={projectVal}
                  onChange={(e) => setProject(i, e.target.value)}
                  placeholder="Checkout Redesign (optional)"
                  className="flex-1 border-b border-border/60 bg-transparent py-1 text-sm text-text-primary placeholder:text-text-muted/70 focus:border-accent focus:outline-none"
                />
              </div>
            )}
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
