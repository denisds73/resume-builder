import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { slugify, isValidSlug } from '@/lib/slug'
import {
  DEFAULT_TEMPLATE_ID,
  TEMPLATE_LIST,
  type TemplateId,
} from '@/resume/templates'
import Button from '@/components/ui/Button'
import { MOTION, EASE } from '@/lib/motion'
import TemplateCard from './TemplateCard'

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
          transition={{ duration: MOTION.backdrop }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: MOTION.base, ease: EASE.out }}
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
                  <legend className="field-label mb-2">Template</legend>
                  <div role="radiogroup" aria-label="Template" className="flex items-stretch gap-2">
                    {TEMPLATE_LIST.map((t) => (
                      <TemplateCard
                        key={t.id}
                        id={t.id}
                        name={t.name}
                        selected={t.id === templateId}
                        onClick={() => setTemplateId(t.id)}
                      />
                    ))}
                  </div>
                  {(() => {
                    const active = TEMPLATE_LIST.find((t) => t.id === templateId)
                    return active ? (
                      <p className="mt-2 text-[0.7rem] text-text-muted">{active.description}</p>
                    ) : null
                  })()}
                </fieldset>
              )}
              {(validation || error) && (
                <p className="field-error-msg">{error ?? validation}</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" type="button" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!canSubmit} loading={submitting}>
                  {submitLabel}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
