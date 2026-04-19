import { Input } from '@/components/ui'
import MonthPicker from '@/components/ui/MonthPicker'
import type { ResumeEducationEntry } from '@/types/resume'
import RepeatableSection from './RepeatableSection'
import BulletsEditor from './BulletsEditor'

interface Props {
  value: ResumeEducationEntry[]
  onChange: (next: ResumeEducationEntry[]) => void
}

const makeEmpty = (): ResumeEducationEntry => ({
  id: crypto.randomUUID(),
  school: '',
  degree: '',
  field: '',
  startDate: null,
  endDate: null,
  bullets: [],
})

export default function EducationEditor({ value, onChange }: Props) {
  return (
    <RepeatableSection
      kicker="06"
      title="Education (optional)"
      items={value}
      onChange={onChange}
      makeEmpty={makeEmpty}
      addLabel="Add degree"
      emptyLabel="No education entries. This section is optional and will be hidden from the resume if empty."
      renderItem={(item, update) => {
        const setField = <K extends keyof ResumeEducationEntry>(
          k: K,
          v: ResumeEducationEntry[K],
        ) => update({ ...item, [k]: v })

        const isPresent = item.endDate === null && Boolean(item.startDate)

        return (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Institution"
                value={item.school}
                onChange={(e) => setField('school', e.target.value)}
              />
              <Input
                label="Degree"
                placeholder="e.g. B.Sc."
                value={item.degree}
                onChange={(e) => setField('degree', e.target.value)}
              />
            </div>
            <Input
              label="Field of study (optional)"
              placeholder="Computer Science"
              value={item.field ?? ''}
              onChange={(e) => setField('field', e.target.value)}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <MonthPicker
                label="Start Date"
                value={item.startDate}
                onChange={(v) => setField('startDate', v)}
              />
              <MonthPicker
                label="End / Graduation"
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
                Highlights (optional)
              </label>
              <BulletsEditor
                bullets={item.bullets ?? []}
                onChange={(bullets) => setField('bullets', bullets)}
                placeholder="Honors, GPA, relevant coursework…"
                addLabel="Add highlight"
              />
            </div>
          </div>
        )
      }}
    />
  )
}
