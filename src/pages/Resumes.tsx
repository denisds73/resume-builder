import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useResumes } from '@/hooks/useResumes'
import { isSupabaseConfigured, type ResumeRow } from '@/lib/supabase'
import { emptyResume } from '@/types/resume'
import { slugify } from '@/lib/slug'
import { toast } from '@/lib/toast'
import { motion } from 'framer-motion'
import ConfirmDialog from '@/components/ConfirmDialog'
import NewResumeDialog from '@/components/resume/NewResumeDialog'
import ResumeCard from '@/components/resume/ResumeCard'
import ResumeCardSkeleton from '@/components/resume/ResumeCardSkeleton'
import RenameDialog from '@/components/resume/RenameDialog'

export default function Resumes() {
  const { user, loading } = useAuth()
  const { handle, defaultTemplate } = useProfile()
  const { resumes, status, setActiveId, create, duplicate, rename, remove } = useResumes()
  const navigate = useNavigate()

  const [newOpen, setNewOpen] = useState(false)
  const [duplicateFrom, setDuplicateFrom] = useState<ResumeRow | null>(null)
  const [renameTarget, setRenameTarget] = useState<ResumeRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ResumeRow | null>(null)

  // Auth still resolving — full bleed, no chrome (router-level state).
  if (loading) {
    return <div className="min-h-screen bg-bg" />
  }

  if (!isSupabaseConfigured || !user) {
    return <Navigate to="/" replace />
  }

  const isInitialLoading = status === 'loading' && resumes.length === 0

  function open(id: string) {
    setActiveId(id)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-bg text-text-primary">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to editor
            </Link>
            <h1 className="mt-6 font-display text-3xl">Your resumes</h1>
            <p className="mt-1 text-sm text-text-secondary">
              {resumes.length === 0
                ? 'Create one to get started.'
                : `${resumes.length} resume${resumes.length === 1 ? '' : 's'}.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setNewOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-accent-hover"
          >
            <Plus className="h-4 w-4" />
            New resume
          </button>
        </div>

        {isInitialLoading ? (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <ResumeCardSkeleton key={i} />
            ))}
          </div>
        ) : resumes.length === 0 ? (
          <div className="mt-12 rounded-xl border border-border bg-surface/30 p-10 text-center">
            <p className="font-display text-lg text-text-primary">No resumes yet</p>
            <p className="mt-1 text-sm text-text-secondary">
              Create your first resume and share it with one link.
            </p>
            <button
              type="button"
              onClick={() => setNewOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-accent-hover"
            >
              <Plus className="h-4 w-4" />
              Create resume
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {resumes.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: Math.min(i, 6) * 0.04, ease: 'easeOut' }}
              >
                <ResumeCard
                  resume={r}
                  publicHandle={handle}
                  onOpen={() => open(r.id)}
                  onDuplicate={() => setDuplicateFrom(r)}
                  onRename={() => setRenameTarget(r)}
                  onDelete={() => setDeleteTarget(r)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <NewResumeDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onSubmit={async ({ name, slug, templateId }) => {
          try {
            await create({
              name,
              slug,
              data: { ...emptyResume(), templateId },
            })
            toast.success(`Created "${name}"`)
            navigate('/')
          } catch {
            toast.error('Could not create resume')
          }
        }}
        title="New resume"
        submitLabel="Create"
        initialTemplateId={defaultTemplate ?? 'classic'}
        existingSlugs={resumes.map((r) => r.slug)}
      />

      <NewResumeDialog
        open={Boolean(duplicateFrom)}
        onClose={() => setDuplicateFrom(null)}
        onSubmit={async ({ name, slug }) => {
          if (!duplicateFrom) return
          try {
            await duplicate(duplicateFrom.id, name, slug)
            toast.success(`Duplicated to "${name}"`)
          } catch {
            toast.error('Could not duplicate resume')
          }
        }}
        title="Duplicate resume"
        submitLabel="Duplicate"
        initialName={duplicateFrom ? `${duplicateFrom.name} (copy)` : ''}
        initialSlug={duplicateFrom ? slugify(`${duplicateFrom.slug}-copy`) : ''}
        existingSlugs={resumes.map((r) => r.slug)}
      />

      <RenameDialog
        open={Boolean(renameTarget)}
        onClose={() => setRenameTarget(null)}
        initialName={renameTarget?.name ?? ''}
        onSubmit={async (next) => {
          if (!renameTarget) return
          try {
            await rename(renameTarget.id, next)
            toast.success('Renamed')
          } catch {
            toast.error('Could not rename resume')
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={deleteTarget ? `Delete "${deleteTarget.name}"?` : 'Delete resume?'}
        description="This can't be undone. Any public link will stop working immediately."
        confirmText="delete"
        confirmLabel="Delete resume"
        onConfirm={async () => {
          if (!deleteTarget) return
          const name = deleteTarget.name
          try {
            await remove(deleteTarget.id)
            toast.success(`Deleted "${name}"`)
          } catch {
            toast.error('Could not delete resume')
          }
        }}
      />
    </div>
  )
}
