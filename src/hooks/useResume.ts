import { useCallback, useEffect, useRef, useState } from 'react'
import { getSupabase, isSupabaseConfigured, type ResumeRow } from '@/lib/supabase'
import { emptyResume, type ResumeData } from '@/types/resume'
import { useAuth } from './useAuth'

const LOCAL_STORAGE_KEY = 'resume:draft'
const DEBOUNCE_MS = 800

type Status = 'idle' | 'loading' | 'saving' | 'saved' | 'error'

export interface UseResumeReturn {
  data: ResumeData
  setData: (updater: ResumeData | ((prev: ResumeData) => ResumeData)) => void
  status: Status
  lastSavedAt: Date | null
  reload: () => Promise<void>
  signedIn: boolean
}

function readLocalDraft(): ResumeData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ResumeData
    return { ...emptyResume(), ...parsed }
  } catch {
    return null
  }
}

function writeLocalDraft(data: ResumeData) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ignore quota errors
  }
}

export function useResume(): UseResumeReturn {
  const { user } = useAuth()
  const [data, setDataState] = useState<ResumeData>(() => readLocalDraft() ?? emptyResume())
  const [status, setStatus] = useState<Status>('loading')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasLoaded = useRef(false)

  const loadFromServer = useCallback(async () => {
    if (!isSupabaseConfigured || !user) {
      setStatus('idle')
      hasLoaded.current = true
      return
    }
    try {
      const { data: row, error } = await getSupabase()
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle<ResumeRow>()
      if (error) throw error
      if (row && row.data) {
        const merged = { ...emptyResume(), ...(row.data as ResumeData) }
        setDataState(merged)
        writeLocalDraft(merged)
        setLastSavedAt(row.updated_at ? new Date(row.updated_at) : new Date())
        setStatus('saved')
      } else {
        setStatus('idle')
      }
    } catch {
      setStatus('error')
    } finally {
      hasLoaded.current = true
    }
  }, [user])

  useEffect(() => {
    loadFromServer()
  }, [loadFromServer])

  const persist = useCallback(
    async (next: ResumeData) => {
      if (!isSupabaseConfigured || !user) {
        setStatus('idle')
        return
      }
      setStatus('saving')
      try {
        const now = new Date().toISOString()
        const { error } = await getSupabase()
          .from('resumes')
          .upsert(
            { user_id: user.id, data: next, updated_at: now },
            { onConflict: 'user_id' },
          )
        if (error) throw error
        setLastSavedAt(new Date(now))
        setStatus('saved')
      } catch {
        setStatus('error')
      }
    },
    [user],
  )

  const setData = useCallback<UseResumeReturn['setData']>(
    (updater) => {
      setDataState((prev) => {
        const next =
          typeof updater === 'function'
            ? (updater as (p: ResumeData) => ResumeData)(prev)
            : updater
        writeLocalDraft(next)
        if (!hasLoaded.current || !user) return next
        if (saveTimer.current) clearTimeout(saveTimer.current)
        setStatus('saving')
        saveTimer.current = setTimeout(() => {
          persist(next)
        }, DEBOUNCE_MS)
        return next
      })
    },
    [persist, user],
  )

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  return {
    data,
    setData,
    status,
    lastSavedAt,
    reload: loadFromServer,
    signedIn: Boolean(user),
  }
}
