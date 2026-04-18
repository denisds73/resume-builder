import { Input } from '@/components/ui'
import type { ResumeSkillGroup } from '@/types/resume'
import RepeatableSection from './RepeatableSection'
import TagInput from './TagInput'

interface Props {
  value: ResumeSkillGroup[]
  onChange: (next: ResumeSkillGroup[]) => void
}

const makeEmpty = (): ResumeSkillGroup => ({
  id: crypto.randomUUID(),
  category: '',
  skills: [],
})

export default function SkillsEditor({ value, onChange }: Props) {
  return (
    <RepeatableSection
      kicker="03"
      title="Skills"
      items={value}
      onChange={onChange}
      makeEmpty={makeEmpty}
      addLabel="Add group"
      emptyLabel="Group skills by category — Languages, Frameworks, Tools…"
      renderItem={(item, update) => (
        <div className="space-y-3">
          <Input
            label="Category"
            placeholder="e.g. Languages, Frameworks, Tools"
            value={item.category}
            onChange={(e) => update({ ...item, category: e.target.value })}
          />
          <TagInput
            label="Skills"
            value={item.skills}
            onChange={(next) => update({ ...item, skills: next })}
            placeholder="TypeScript, React, …"
          />
        </div>
      )}
    />
  )
}
