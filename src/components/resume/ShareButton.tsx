import { Share2 } from 'lucide-react'
import type { ShareMode } from '@/lib/supabase'

export interface ShareButtonProps {
  shareMode: ShareMode
  onClick: () => void
  disabled?: boolean
}

function chipLabel(mode: ShareMode): string | null {
  if (mode === 'live') return 'Live'
  if (mode === 'snapshot') return 'Snapshot'
  return null
}

export default function ShareButton({ shareMode, onClick, disabled }: ShareButtonProps) {
  const chip = chipLabel(shareMode)
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text-primary transition-colors hover:border-border-hover disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Share2 className="h-4 w-4" />
      Share
      {chip && (
        <span
          className={`ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.16em] ${
            shareMode === 'live'
              ? 'bg-accent/10 text-accent'
              : 'bg-surface-hover text-text-secondary'
          }`}
        >
          <span
            className={`h-1 w-1 rounded-full ${shareMode === 'live' ? 'bg-accent' : 'bg-accent/50'}`}
          />
          {chip}
        </span>
      )}
    </button>
  )
}
