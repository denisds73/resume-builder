import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Copy, CheckCircle2, ExternalLink } from 'lucide-react'
import type { ShareMode } from '@/lib/supabase'
import type { ResumeData } from '@/types/resume'
import { toast } from '@/lib/toast'
import Button from '@/components/ui/Button'
import HandleClaimDialog from './HandleClaimDialog'

export interface SharePanelProps {
  open: boolean
  onClose: () => void

  handle: string | null
  onClaimHandle: (handle: string) => Promise<void>

  slug: string | null
  shareMode: ShareMode
  onSetShareMode: (mode: ShareMode) => Promise<void>

  data: ResumeData
  publishedData: ResumeData | null
  onPublish: () => Promise<void>
}

function publicUrl(handle: string, slug: string): string {
  return `https://resumef.vercel.app/@${handle}/${slug}`
}

function hasUnpublishedChanges(data: ResumeData, published: ResumeData | null): boolean {
  if (!published) return true
  return JSON.stringify(data) !== JSON.stringify(published)
}

export default function SharePanel({
  open,
  onClose,
  handle,
  onClaimHandle,
  slug,
  shareMode,
  onSetShareMode,
  data,
  publishedData,
  onPublish,
}: SharePanelProps) {
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) setCopied(false)
  }, [open])

  async function doSet(mode: ShareMode) {
    setBusy(true)
    try {
      await onSetShareMode(mode)
      toast.success(mode === 'live' ? 'Sharing live updates' : 'Sharing a snapshot')
    } catch {
      toast.error('Could not change share mode')
    } finally {
      setBusy(false)
    }
  }

  async function doPublish() {
    setBusy(true)
    try {
      await onPublish()
      toast.success('Published latest changes')
    } catch {
      toast.error('Could not publish changes')
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    if (!handle || !slug) return
    try {
      await navigator.clipboard.writeText(publicUrl(handle, slug))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
      toast.success('Link copied')
    } catch {
      toast.error('Could not copy link')
    }
  }

  const url = handle && slug ? publicUrl(handle, slug) : null
  const unpublished = shareMode === 'snapshot' && hasUnpublishedChanges(data, publishedData)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-24"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full max-w-md rounded-xl border border-border bg-bg-card p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 className="font-display text-xl text-text-primary">Share this resume</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-md p-1 text-text-muted hover:bg-surface hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!handle ? (
              <HandleClaimDialog onClaim={onClaimHandle} />
            ) : (
              <div className="space-y-5">
                <fieldset className="space-y-2">
                  <legend className="field-label mb-1">Sharing mode</legend>
                  {(['off', 'live', 'snapshot'] as ShareMode[]).map((mode) => (
                    <label
                      key={mode}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                        shareMode === mode
                          ? 'border-accent bg-accent/5'
                          : 'border-border hover:border-border-hover'
                      }`}
                    >
                      <input
                        type="radio"
                        name="share-mode"
                        value={mode}
                        checked={shareMode === mode}
                        disabled={busy}
                        onChange={() => doSet(mode)}
                        className="mt-1 accent-accent"
                      />
                      <span className="flex-1">
                        <span className="block text-sm font-medium text-text-primary">
                          {mode === 'off' && 'Off'}
                          {mode === 'live' && 'Live'}
                          {mode === 'snapshot' && 'Snapshot'}
                        </span>
                        <span className="block text-xs text-text-secondary">
                          {mode === 'off' && 'Not publicly accessible.'}
                          {mode === 'live' && 'Public URL always reflects the latest edits.'}
                          {mode === 'snapshot' && 'Public URL shows the last published version.'}
                        </span>
                      </span>
                    </label>
                  ))}
                </fieldset>

                {shareMode !== 'off' && url && (
                  <div>
                    <span className="field-label">Public URL</span>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 truncate rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs text-text-primary">
                        {url}
                      </code>
                      <button
                        type="button"
                        onClick={copy}
                        aria-label="Copy URL"
                        className="rounded-md border border-border bg-surface p-2 text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
                      >
                        {copied ? <CheckCircle2 className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                      </button>
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Open in new tab"
                        className="rounded-md border border-border bg-surface p-2 text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                )}

                {shareMode === 'snapshot' && (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3">
                    <div>
                      <p className="text-sm text-text-primary">
                        {publishedData ? 'Snapshot published' : 'Not yet published'}
                      </p>
                      {unpublished && (
                        <p className="text-xs text-accent">Unpublished changes</p>
                      )}
                    </div>
                    <Button onClick={doPublish} disabled={busy} loading={busy}>
                      {publishedData ? 'Update' : 'Publish'}
                    </Button>
                  </div>
                )}

                {shareMode !== 'off' && (
                  <button
                    type="button"
                    onClick={() => doSet('off')}
                    disabled={busy}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary disabled:opacity-50"
                  >
                    Stop sharing
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
