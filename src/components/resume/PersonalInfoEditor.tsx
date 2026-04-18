import { Input } from '@/components/ui'
import type { ResumePersonal } from '@/types/resume'

interface Props {
  value: ResumePersonal
  onChange: (next: ResumePersonal) => void
}

export default function PersonalInfoEditor({ value, onChange }: Props) {
  const update = <K extends keyof ResumePersonal>(key: K, v: ResumePersonal[K]) => {
    onChange({ ...value, [key]: v })
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <header className="mb-5">
        <p className="mb-1 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-text-muted">
          01
        </p>
        <h2 className="font-display text-xl text-text-primary">Personal Information</h2>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="First Name"
          value={value.firstName}
          onChange={(e) => update('firstName', e.target.value)}
        />
        <Input
          label="Last Name"
          value={value.lastName}
          onChange={(e) => update('lastName', e.target.value)}
        />
        <Input
          label="Title / Role"
          placeholder="e.g. Frontend Engineer"
          value={value.title}
          onChange={(e) => update('title', e.target.value)}
          className="sm:col-span-2"
        />
        <Input
          label="Email"
          type="email"
          value={value.email}
          onChange={(e) => update('email', e.target.value)}
        />
        <Input
          label="Phone"
          value={value.phone ?? ''}
          onChange={(e) => update('phone', e.target.value)}
        />
        <Input
          label="Location"
          placeholder="City, Country"
          value={value.location ?? ''}
          onChange={(e) => update('location', e.target.value)}
        />
        <Input
          label="Portfolio URL"
          placeholder="https://…"
          value={value.website ?? ''}
          onChange={(e) => update('website', e.target.value)}
        />
        <Input
          label="LinkedIn"
          placeholder="linkedin.com/in/…"
          value={value.linkedin ?? ''}
          onChange={(e) => update('linkedin', e.target.value)}
        />
        <Input
          label="GitHub"
          placeholder="github.com/…"
          value={value.github ?? ''}
          onChange={(e) => update('github', e.target.value)}
        />
        <Input
          label="LeetCode"
          placeholder="leetcode.com/u/…"
          value={value.leetcode ?? ''}
          onChange={(e) => update('leetcode', e.target.value)}
        />
      </div>
    </section>
  )
}
