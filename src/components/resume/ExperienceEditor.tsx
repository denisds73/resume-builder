import { FolderPlus, X } from 'lucide-react'
import { Input } from '@/components/ui'
import MonthPicker from '@/components/ui/MonthPicker'
import type {
  ResumeExperienceEntry,
  ResumeProjectGroup,
} from '@/types/resume'
import RepeatableSection from './RepeatableSection'
import BulletsEditor from './BulletsEditor'

interface Props {
  value: ResumeExperienceEntry[]
  onChange: (next: ResumeExperienceEntry[]) => void
}

const makeProject = (): ResumeProjectGroup => ({
  id: crypto.randomUUID(),
  name: '',
  bullets: [''],
})

const makeEmpty = (): ResumeExperienceEntry => ({
  id: crypto.randomUUID(),
  company: '',
  role: '',
  location: '',
  startDate: null,
  endDate: null,
  projects: [makeProject()],
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
        const projects = item.projects

        const updateProject = (id: string, next: Partial<ResumeProjectGroup>) =>
          setField(
            'projects',
            projects.map((p) => (p.id === id ? { ...p, ...next } : p)),
          )
        const addProject = () =>
          setField('projects', [...projects, makeProject()])
        const removeProject = (id: string) => {
          const next = projects.filter((p) => p.id !== id)
          setField('projects', next.length > 0 ? next : [makeProject()])
        }

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

            <div className="space-y-3">
              {projects.map((p, idx) => (
                <div
                  key={p.id}
                  className="space-y-2 rounded-lg border border-border/70 bg-bg-card/40 p-3"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <Input
                        label={
                          projects.length > 1
                            ? `Project ${idx + 1} (optional)`
                            : 'Project name (optional)'
                        }
                        value={p.name}
                        onChange={(e) =>
                          updateProject(p.id, { name: e.target.value })
                        }
                        placeholder="Checkout Redesign"
                      />
                    </div>
                    {projects.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProject(p.id)}
                        className="mt-7 cursor-pointer rounded-lg p-2 text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
                        aria-label="Remove project"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm text-text-secondary">
                      Bullet points
                    </label>
                    <BulletsEditor
                      bullets={p.bullets}
                      onChange={(bullets) => updateProject(p.id, { bullets })}
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addProject}
                className="group inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-border bg-transparent px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent"
              >
                <FolderPlus className="h-3.5 w-3.5" />
                Add project
              </button>
            </div>
          </div>
        )
      }}
    />
  )
}
