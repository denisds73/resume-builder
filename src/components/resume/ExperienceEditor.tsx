import { useRef } from 'react'
import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui'
import MonthPicker from '@/components/ui/MonthPicker'
import type { ResumeExperienceEntry } from '@/types/resume'
import RepeatableSection from './RepeatableSection'

interface Props {
  value: ResumeExperienceEntry[]
  onChange: (next: ResumeExperienceEntry[]) => void
}

const makeEmpty = (): ResumeExperienceEntry => ({
  id: crypto.randomUUID(),
  company: '',
  role: '',
  location: '',
  startDate: null,
  endDate: null,
  bullets: [''],
})

// Keeps per-bullet stable keys without changing the wire format (bullets: string[]).
// React keys must be stable across reorders/removals; indices cause focus and input
// state to follow the wrong row when a middle bullet is deleted.
function BulletsEditor({
  bullets,
  onChange,
}: {
  bullets: string[]
  onChange: (next: string[]) => void
}) {
  const keysRef = useRef<string[]>([])
  // Grow/shrink keys to match the current bullet count; only generate new keys
  // for newly appended items.
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
          <span className="mt-2.5 text-text-muted" aria-hidden="true">•</span>
          <input
            value={b}
            onChange={(e) => setBullet(i, e.target.value)}
            placeholder="Shipped feature X that achieved Y…"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent"
          />
          <button
            type="button"
            onClick={() => removeBullet(i)}
            className="rounded-lg p-2 text-text-muted hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
            aria-label="Remove bullet"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addBullet}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent"
      >
        <Plus className="h-3 w-3" />
        Add bullet
      </button>
    </div>
  )
}

export default function ExperienceEditor({ value, onChange }: Props) {
  return (
    <RepeatableSection
      kicker="04"
      title="Experience"
      items={value}
      onChange={onChange}
      makeEmpty={makeEmpty}
      addLabel="Add role"
      emptyLabel="No work experience yet. Add your first role."
      renderItem={(item, update) => {
        const setField = <K extends keyof ResumeExperienceEntry>(
          k: K,
          v: ResumeExperienceEntry[K],
        ) => update({ ...item, [k]: v })

        const isPresent = item.endDate === null && Boolean(item.startDate)

        return (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Role"
                value={item.role}
                onChange={(e) => setField('role', e.target.value)}
              />
              <Input
                label="Company"
                value={item.company}
                onChange={(e) => setField('company', e.target.value)}
              />
            </div>
            <Input
              label="Location (optional)"
              value={item.location ?? ''}
              onChange={(e) => setField('location', e.target.value)}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <MonthPicker
                label="Start Date"
                value={item.startDate}
                onChange={(v) => setField('startDate', v)}
              />
              <MonthPicker
                label="End Date"
                value={item.endDate}
                onChange={(v) => setField('endDate', v)}
                allowPresent
                isPresent={isPresent}
                onPresentChange={(present) =>
                  setField('endDate', present ? null : (item.endDate ?? ''))
                }
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-text-secondary">
                Bullet points
              </label>
              <BulletsEditor
                bullets={item.bullets}
                onChange={(bullets) => update({ ...item, bullets })}
              />
            </div>
          </div>
        )
      }}
    />
  )
}
