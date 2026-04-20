import { RichTextarea } from '@/components/ui'

interface Props {
  value: string
  onChange: (next: string) => void
}

export default function SummaryEditor({ value, onChange }: Props) {
  const count = value.length

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <header className="mb-5 flex items-end justify-between">
        <div>
          <p className="mb-1 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-text-muted">
            02
          </p>
          <h2 className="font-display text-xl text-text-primary">Professional Summary</h2>
        </div>
        <span className="font-mono text-[0.7rem] text-text-muted">{count} chars</span>
      </header>
      <RichTextarea
        label="Summary"
        rows={4}
        placeholder="A short 2–3 sentence pitch — who you are, what you build, what you're good at."
        helper="Select any text to make it bold or italic."
        value={value}
        onChange={onChange}
      />
    </section>
  )
}
