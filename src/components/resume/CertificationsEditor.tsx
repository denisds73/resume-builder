import { Input } from '@/components/ui'
import type { ResumeCertEntry } from '@/types/resume'
import RepeatableSection from './RepeatableSection'

interface Props {
  value: ResumeCertEntry[]
  onChange: (next: ResumeCertEntry[]) => void
}

const makeEmpty = (): ResumeCertEntry => ({
  id: crypto.randomUUID(),
  name: '',
  issuer: '',
  date: '',
  url: '',
})

export default function CertificationsEditor({ value, onChange }: Props) {
  return (
    <RepeatableSection
      kicker="07"
      title="Certifications (optional)"
      items={value}
      onChange={onChange}
      makeEmpty={makeEmpty}
      addLabel="Add cert"
      emptyLabel="No certifications yet. This section is optional and will be hidden from the resume if empty."
      renderItem={(item, update) => {
        const setField = <K extends keyof ResumeCertEntry>(
          k: K,
          v: ResumeCertEntry[K],
        ) => update({ ...item, [k]: v })

        return (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Name"
                value={item.name}
                onChange={(e) => setField('name', e.target.value)}
              />
              <Input
                label="Issuer"
                value={item.issuer}
                onChange={(e) => setField('issuer', e.target.value)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Date"
                placeholder="e.g. Jun 2024"
                value={item.date}
                onChange={(e) => setField('date', e.target.value)}
              />
              <Input
                label="URL (optional)"
                placeholder="https://…"
                value={item.url ?? ''}
                onChange={(e) => setField('url', e.target.value)}
              />
            </div>
          </div>
        )
      }}
    />
  )
}
