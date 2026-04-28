import { useCallback, useEffect, useRef, useState } from 'react'
import { getSupabase, isSupabaseConfigured, type ResumeRow, type ShareMode } from '@/lib/supabase'
import { emptyResume, type ResumeData } from '@/types/resume'
import { migrateResumeData } from '@/lib/migrateResume'
import { useAuth } from './useAuth'
import { useHistory } from './useHistory'

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
  viewCount: number
  publish: () => Promise<void>
  signedIn: boolean
  slug: string | null
  name: string
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  commitHistory: () => void
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
  const history = useHistory<ResumeData>(
    () => readLocalDraft() ?? emptyResume(),
    { capacity: 50, coalesceMs: 500 },
  )
  const { state: data, set: setDataState, reset: resetHistory, undo: historyUndo, redo: historyRedo, canUndo, canRedo, commit: commitHistory } = history
  // Tracks the last resume we saved to Supabase so undo/redo and text edits
  // trigger the save pipeline, but loads (fresh row from the server) do not.
  const [lastSavedSerialized, setLastSavedSerialized] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load when resumeId changes. Loading is NOT a user edit, so it resets
  // history to anchor against the freshly-loaded snapshot.
  useEffect(() => {
    let active = true
    if (!resumeId || !user || !isSupabaseConfigured) {
      setRow(null)
      if (!user) resetHistory(readLocalDraft() ?? emptyResume())
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
        let seed: ResumeData
        try {
          seed = migrateResumeData({ ...emptyResume(), ...loaded.data })
        } catch {
          seed = { ...emptyResume(), ...loaded.data }
        }
        resetHistory(seed)
        setLastSavedSerialized(JSON.stringify(seed))
        setLastSavedAt(loaded.updated_at ? new Date(loaded.updated_at) : null)
        setStatus('saved')
      })
    return () => {
      active = false
    }
  }, [resumeId, user, resetHistory])

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
      setDataState(updater)
    },
    [setDataState],
  )

  // A single save pipeline driven by `data` changes. Covers text edits,
  // structural mutations, and undo/redo uniformly. Skips when the current
  // snapshot matches what we last persisted (e.g. right after load) so a
  // freshly loaded resume does not trigger a redundant save.
  const currentSerialized = JSON.stringify(data)
  useEffect(() => {
    if (lastSavedSerialized === currentSerialized) return
    writeLocalDraft(data)
    // Anonymous mode: localStorage is the persistence layer; there is no
    // cloud save to compare against, so we leave lastSavedSerialized null
    // and the UI falls back to the "Draft saved locally" chip.
    if (!user || !resumeId) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    const snapshot = data
    const snapshotSerialized = currentSerialized
    saveTimer.current = setTimeout(async () => {
      await persist(snapshot)
      setLastSavedSerialized(snapshotSerialized)
    }, DEBOUNCE_MS)
  }, [data, currentSerialized, lastSavedSerialized, user, resumeId, persist])

  // Show 'saving' in the UI whenever local data is ahead of the last
  // persisted snapshot, without mutating state inside the save effect.
  const isDirty = lastSavedSerialized !== null && currentSerialized !== lastSavedSerialized
  const effectiveStatus: Status =
    status === 'loading' || status === 'error'
      ? status
      : isDirty
        ? 'saving'
        : status

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
  }, [])

  // Undo/redo fire regardless of whether the save effect has flushed, so
  // the user sees an instant reversion and the effect picks up the save.
  const undo = useCallback(() => historyUndo(), [historyUndo])
  const redo = useCallback(() => historyRedo(), [historyRedo])

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
    status: effectiveStatus,
    lastSavedAt,
    shareMode: row?.share_mode ?? 'off',
    setShareMode,
    publishedData: (row?.published_data as ResumeData) ?? null,
    publishedAt: row?.published_at ? new Date(row.published_at) : null,
    viewCount: row?.view_count ?? 0,
    publish,
    signedIn: Boolean(user),
    slug: row?.slug ?? null,
    name: row?.name ?? '',
    undo,
    redo,
    canUndo,
    canRedo,
    commitHistory,
  }
}
