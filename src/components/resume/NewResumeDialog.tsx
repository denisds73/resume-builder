import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Check } from 'lucide-react'
import { slugify, isValidSlug } from '@/lib/slug'
import {
  DEFAULT_TEMPLATE_ID,
  TEMPLATE_LIST,
  type TemplateId,
} from '@/resume/templates'

export interface NewResumeDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (input: { name: string; slug: string; templateId: TemplateId }) => Promise<void>
  title: string                         // "New resume" | "Duplicate resume"
  submitLabel: string                   // "Create" | "Duplicate"
  initialName?: string
  initialSlug?: string
  /**
   * If provided, the template picker is shown with this option preselected.
   * Omit to hide the picker (e.g. for the duplicate flow, which inherits
   * the source resume's template).
   */
  initialTemplateId?: TemplateId
  existingSlugs: string[]
}

export default function NewResumeDialog({
  open,
  onClose,
  onSubmit,
  title,
  submitLabel,
  initialName = '',
  initialSlug = '',
  initialTemplateId,
  existingSlugs,
}: NewResumeDialogProps) {
  const showTemplatePicker = initialTemplateId !== undefined
  const [name, setName] = useState(initialName)
  const [slug, setSlug] = useState(initialSlug)
  const [slugTouched, setSlugTouched] = useState(Boolean(initialSlug))
  const [templateId, setTemplateId] = useState<TemplateId>(initialTemplateId ?? DEFAULT_TEMPLATE_ID)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(initialName)
      setSlug(initialSlug)
      setSlugTouched(Boolean(initialSlug))
      setTemplateId(initialTemplateId ?? DEFAULT_TEMPLATE_ID)
      setError(null)
    }
  }, [open, initialName, initialSlug, initialTemplateId])

  const existing = useMemo(() => new Set(existingSlugs), [existingSlugs])

  const validation: string | null = (() => {
    if (!name.trim()) return 'Name is required.'
    if (!slug) return 'Slug is required.'
    if (!isValidSlug(slug))
      return 'Slug: lowercase letters, numbers, hyphens; 2–64 chars, no leading/trailing hyphen.'
    if (existing.has(slug)) return 'You already have a resume with that slug.'
    return null
  })()

  const canSubmit = !validation && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({ name: name.trim(), slug, templateId })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

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
              <h2 className="font-display text-xl text-text-primary">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-md p-1 text-text-muted hover:bg-surface hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="field-label" htmlFor="new-resume-name">Name</label>
                <input
                  id="new-resume-name"
                  className="field-input"
                  value={name}
                  onChange={(e) => {
                    const next = e.target.value
                    setName(next)
                    if (!slugTouched) setSlug(slugify(next))
                  }}
                  placeholder="Frontend"
                  autoFocus
                />
              </div>
              <div>
                <label className="field-label" htmlFor="new-resume-slug">URL slug</label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-text-muted">/@handle/</span>
                  <input
                    id="new-resume-slug"
                    className="field-input flex-1"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value.toLowerCase())
                      setSlugTouched(true)
                    }}
                    placeholder="frontend"
                  />
                </div>
                <p className="mt-1 text-[0.7rem] text-text-muted">
                  Frozen after creation — pick carefully.
                </p>
              </div>
              {showTemplatePicker && (
                <fieldset>
                  <legend className="field-label">Template</legend>
                  <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Template">
                    {TEMPLATE_LIST.map((t) => {
                      const selected = t.id === templateId
                      return (
                        <button
                          key={t.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setTemplateId(t.id)}
                          className={`relative rounded-lg border px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
                            selected
                              ? 'border-accent bg-accent/10 text-text-primary'
                              : 'border-border bg-surface text-text-secondary hover:border-border-hover hover:text-text-primary'
                          }`}
                        >
                          {selected && (
                            <Check className="absolute right-1.5 top-1.5 h-3.5 w-3.5 text-accent" />
                          )}
                          <span className="block font-medium">{t.name}</span>
                          <span className="mt-0.5 block text-[0.68rem] leading-tight text-text-muted">
                            {t.description}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </fieldset>
              )}
              {(validation || error) && (
                <p className="field-error-msg">{error ?? validation}</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg px-4 py-2 text-sm text-text-secondary hover:bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Working…' : submitLabel}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
