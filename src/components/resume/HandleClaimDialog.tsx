import { useState } from 'react'
import { validateHandle, handleErrorMessage } from '@/lib/slug'

export interface HandleClaimDialogProps {
  onClaim: (handle: string) => Promise<void>
}

/**
 * Inline view (not a modal wrapper) rendered inside SharePanel when the
 * user has no handle yet. Once claimed, SharePanel transitions to its
 * normal share-mode UI.
 */
export default function HandleClaimDialog({ onClaim }: HandleClaimDialogProps) {
  const [value, setValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const validation = value ? validateHandle(value) : null
  const clientError =
    validation && !validation.ok ? handleErrorMessage(validation.reason) : null
  const error = serverError ?? clientError

  async function submit() {
    if (!validation?.ok || submitting) return
    setSubmitting(true)
    setServerError(null)
    try {
      await onClaim(value)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Claim failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h3 className="mb-2 font-display text-lg text-text-primary">Pick your handle</h3>
      <p className="mb-4 text-sm text-text-secondary">
        This is the <span className="font-mono">@</span> part of your public resume URL.
        You can't change it later.
      </p>
      <label className="field-label" htmlFor="handle-input">Handle</label>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-text-muted">resumef.vercel.app/@</span>
        <input
          id="handle-input"
          className="field-input flex-1"
          value={value}
          onChange={(e) => {
            setValue(e.target.value.toLowerCase())
            setServerError(null)
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          placeholder="denis"
          autoFocus
        />
      </div>
      {error && <p className="field-error-msg mt-2">{error}</p>}
      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={submit}
          disabled={!validation?.ok || submitting}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Claiming…' : 'Claim handle'}
        </button>
      </div>
    </div>
  )
}
