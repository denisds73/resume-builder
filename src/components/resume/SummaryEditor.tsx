import { RichTextarea } from '@/components/ui'

interface Props {
  value: string
  onChange: (next: string) => void
}

// Soft target zone for resume summaries: a single tight paragraph,
// roughly 200-600 characters. Below 200 reads as too thin; above 600
// starts crowding everything below it.
const SOFT_MIN = 200
const SOFT_MAX = 600

export default function SummaryEditor({ value, onChange }: Props) {
  const count = value.length
  const within = count >= SOFT_MIN && count <= SOFT_MAX
  const over = count > SOFT_MAX
  const tone = over
    ? 'text-amber-300'
    : within
      ? 'text-accent'
      : 'text-text-muted'
  const dotTone = over
    ? 'bg-amber-300'
    : within
      ? 'bg-accent'
      : 'bg-text-muted/60'

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <header className="mb-5 flex items-end justify-between">
        <div>
          <p className="mb-1 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-text-muted">
            02
          </p>
          <h2 className="font-display text-xl text-text-primary">Professional Summary</h2>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 font-mono text-[0.7rem] ${tone}`}
          title={`Recommended ${SOFT_MIN}-${SOFT_MAX} characters`}
        >
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotTone}`} aria-hidden />
          {count} / {SOFT_MAX}
        </span>
      </header>
      <RichTextarea
        label="Summary"
        rows={6}
        autoGrow
        placeholder="A short 2–3 sentence pitch — who you are, what you build, what you're good at."
        helper="Select any text to make it bold or italic."
        value={value}
        onChange={onChange}
      />
    </section>
  )
}
