import { Check } from 'lucide-react'
import type { TemplateId } from '@/resume/templates'
import TemplateThumbnail from './TemplateThumbnail'

interface Props {
  id: TemplateId
  name: string
  selected: boolean
  onClick: () => void
  size?: 'sm' | 'md'
}

export default function TemplateCard({ id, name, selected, onClick, size = 'md' }: Props) {
  const thumbCls = size === 'sm' ? 'h-[84px] w-[64px]' : 'h-[110px] w-[84px]'
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`group relative flex flex-col items-center gap-2 rounded-xl border p-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
        selected
          ? 'border-accent bg-accent/10'
          : 'border-border bg-surface hover:border-border-hover'
      }`}
    >
      <span
        className={`relative overflow-hidden rounded-md shadow-sm shadow-black/30 transition-transform group-hover:scale-[1.02] ${thumbCls}`}
      >
        <TemplateThumbnail id={id} className="h-full w-full" />
      </span>
      <span className={`text-xs font-medium ${selected ? 'text-text-primary' : 'text-text-secondary'}`}>
        {name}
      </span>
      {selected && (
        <span
          aria-hidden
          className="absolute right-1.5 top-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-accent text-background"
        >
          <Check className="h-2.5 w-2.5" />
        </span>
      )}
    </button>
  )
}
