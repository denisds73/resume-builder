import { Input, Textarea } from '@/components/ui'
import type { ResumeProjectEntry } from '@/types/resume'
import RepeatableSection from './RepeatableSection'
import TagInput from './TagInput'

interface Props {
  value: ResumeProjectEntry[]
  onChange: (next: ResumeProjectEntry[]) => void
}

const makeEmpty = (): ResumeProjectEntry => ({
  id: crypto.randomUUID(),
  name: '',
  url: '',
  description: '',
  tech: [],
})

export default function ProjectsEditor({ value, onChange }: Props) {
  return (
    <RepeatableSection
      kicker="05"
      title="Projects"
      items={value}
      onChange={onChange}
      makeEmpty={makeEmpty}
      addLabel="Add project"
      emptyLabel="No projects yet. Showcase something you've built."
      renderItem={(item, update) => {
        const setField = <K extends keyof ResumeProjectEntry>(
          k: K,
          v: ResumeProjectEntry[K],
        ) => update({ ...item, [k]: v })

        return (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
              <Input
                label="Project Name"
                value={item.name}
                onChange={(e) => setField('name', e.target.value)}
              />
              <Input
                label="URL (optional)"
                placeholder="https://…"
                value={item.url ?? ''}
                onChange={(e) => setField('url', e.target.value)}
              />
            </div>
            <Textarea
              label="Description"
              rows={2}
              value={item.description}
              onChange={(e) => setField('description', e.target.value)}
            />
            <TagInput
              label="Tech stack"
              value={item.tech}
              onChange={(next) => setField('tech', next)}
              placeholder="React, Supabase, …"
            />
          </div>
        )
      }}
    />
  )
}
