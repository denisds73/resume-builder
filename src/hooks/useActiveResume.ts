import { useCallback, useEffect, useRef, useState } from 'react'
import { getSupabase, isSupabaseConfigured, type ResumeRow, type ShareMode } from '@/lib/supabase'
import { emptyResume, type ResumeData } from '@/types/resume'
import { migrateResumeData } from '@/lib/migrateResume'
import { useAuth } from './useAuth'

const LOCAL_DRAFT_KEY = 'resume:draft'  // preserved from old useResume
const DEBOUNCE_MS = 800

type Status = 'idle' | 'loading' | 'saving' | 'saved' | 'error'

export interface UseActiveResumeReturn {
  data: ResumeData
  setData: (updater: ResumeData | ((prev: ResumeData) => ResumeData)) => void
  status: Status
  lastSavedAt: Date | null
  shareMode: ShareMode
  setShareMode: (mode: ShareMode) => Promise<void>
  publishedData: ResumeData | null
  publishedAt: Date | null
  publish: () => Promise<void>
  signedIn: boolean
  slug: string | null
  name: string
}

function readLocalDraft(): ResumeData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(LOCAL_DRAFT_KEY)
    if (!raw) return null
    return migrateResumeData({ ...emptyResume(), ...(JSON.parse(raw) as ResumeData) })
  } catch {
    return null
  }
}

function writeLocalDraft(data: ResumeData) {
  try {
    window.localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(data))
  } catch {
    // quota — ignore
  }
}

/**
 * Read/write a single resume by id. If resumeId is null the hook falls back
 * to the pre-signin localStorage draft so the editor still works for
 * anonymous users.
 */
export function useActiveResume(resumeId: string | null): UseActiveResumeReturn {
  const { user } = useAuth()
  const [row, setRow] = useState<ResumeRow | null>(null)
  const [data, setDataState] = useState<ResumeData>(() => readLocalDraft() ?? emptyResume())
  const [status, setStatus] = useState<Status>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load when resumeId changes
  useEffect(() => {
    let active = true
    if (!resumeId || !user || !isSupabaseConfigured) {
      setRow(null)
      // Keep local draft if we're in anon mode
      if (!user) setDataState(readLocalDraft() ?? emptyResume())
      setStatus('idle')
      return
    }
    setStatus('loading')
    getSupabase()
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .maybeSingle<ResumeRow>()
      .then(({ data: loaded, error }) => {
        if (!active) return
        if (error || !loaded) {
          setStatus('error')
          return
        }
        setRow(loaded)
        setDataState(migrateResumeData({ ...emptyResume(), ...loaded.data }))
        setLastSavedAt(loaded.updated_at ? new Date(loaded.updated_at) : null)
        setStatus('saved')
      })
    return () => {
      active = false
    }
  }, [resumeId, user])

  const persist = useCallback(
    async (next: ResumeData) => {
      if (!resumeId || !user) return
      setStatus('saving')
      const now = new Date().toISOString()
      const { error } = await getSupabase()
        .from('resumes')
        .update({ data: next, updated_at: now })
        .eq('id', resumeId)
      if (error) {
        setStatus('error')
        return
      }
      setLastSavedAt(new Date(now))
      setStatus('saved')
    },
    [resumeId, user],
  )

  const setData = useCallback<UseActiveResumeReturn['setData']>(
    (updater) => {
      setDataState((prev) => {
        const next =
          typeof updater === 'function'
            ? (updater as (p: ResumeData) => ResumeData)(prev)
            : updater
        writeLocalDraft(next)
        if (!user || !resumeId) return next
        if (saveTimer.current) clearTimeout(saveTimer.current)
        setStatus('saving')
        saveTimer.current = setTimeout(() => persist(next), DEBOUNCE_MS)
        return next
      })
    },
    [persist, user, resumeId],
  )

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
  }, [])

  const setShareMode = useCallback<UseActiveResumeReturn['setShareMode']>(
    async (mode) => {
      if (!resumeId) return
      const { error } = await getSupabase()
        .from('resumes')
        .update({ share_mode: mode, updated_at: new Date().toISOString() })
        .eq('id', resumeId)
      if (error) throw new Error(error.message)
      setRow((r) => (r ? { ...r, share_mode: mode } : r))
    },
    [resumeId],
  )

  const publish = useCallback<UseActiveResumeReturn['publish']>(async () => {
    if (!resumeId) return
    const { error } = await getSupabase().rpc('publish_resume', { resume_id: resumeId })
    if (error) throw new Error(error.message)
    // Refetch to get the new published_data + published_at
    const { data: refreshed } = await getSupabase()
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .maybeSingle<ResumeRow>()
    if (refreshed) setRow(refreshed)
  }, [resumeId])

  return {
    data,
    setData,
    status,
    lastSavedAt,
    shareMode: row?.share_mode ?? 'off',
    setShareMode,
    publishedData: (row?.published_data as ResumeData) ?? null,
    publishedAt: row?.published_at ? new Date(row.published_at) : null,
    publish,
    signedIn: Boolean(user),
    slug: row?.slug ?? null,
    name: row?.name ?? '',
  }
}
