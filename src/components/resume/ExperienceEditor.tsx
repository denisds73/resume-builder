import { Input } from '@/components/ui'
import MonthPicker from '@/components/ui/MonthPicker'
import type { ResumeExperienceEntry } from '@/types/resume'
import RepeatableSection from './RepeatableSection'
import BulletsEditor from './BulletsEditor'

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
