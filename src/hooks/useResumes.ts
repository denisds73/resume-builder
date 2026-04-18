import { useCallback, useEffect, useState } from 'react'
import { getSupabase, isSupabaseConfigured, type ResumeRow } from '@/lib/supabase'
import { emptyResume, type ResumeData } from '@/types/resume'
import { useAuth } from './useAuth'

type Status = 'idle' | 'loading' | 'ready' | 'error'

export interface UseResumesReturn {
  resumes: ResumeRow[]
  status: Status
  activeId: string | null
  setActiveId: (id: string) => void
  create: (input: { name: string; slug: string; data?: ResumeData }) => Promise<ResumeRow>
  duplicate: (sourceId: string, name: string, slug: string) => Promise<ResumeRow>
  rename: (id: string, name: string) => Promise<void>
  remove: (id: string) => Promise<void>
  reload: () => Promise<void>
}

const LOCAL_ACTIVE_KEY = 'resumefolio:active-resume-id'

export function useResumes(): UseResumesReturn {
  const { user } = useAuth()
  const [resumes, setResumes] = useState<ResumeRow[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [activeId, setActiveIdState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(LOCAL_ACTIVE_KEY)
  })

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !user) {
      setResumes([])
      setStatus('idle')
      return
    }
    setStatus('loading')
    const { data, error } = await getSupabase()
      .from('resumes')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
    if (error) {
      setStatus('error')
      return
    }
    let rows = (data ?? []) as ResumeRow[]

    // First sign-in from anon: if no rows exist, upsert the localStorage
    // draft as their first resume (spec §4.2). Zero-row state should never
    // be visible to the user past this point.
    if (rows.length === 0) {
      const raw = window.localStorage.getItem('resume:draft')
      const draftData = raw ? JSON.parse(raw) : {}
      const { data: first, error: createErr } = await getSupabase()
        .from('resumes')
        .insert({
          user_id: user.id,
          slug: 'resume',
          name: 'My resume',
          data: draftData,
        })
        .select('*')
        .single<ResumeRow>()
      if (createErr) {
        setStatus('error')
        return
      }
      rows = [first]
    }

    setResumes(rows)
    setStatus('ready')
    const currentIsValid = activeId && rows.some((r) => r.id === activeId)
    if (!currentIsValid) {
      setActiveIdState(rows[0].id)
      window.localStorage.setItem(LOCAL_ACTIVE_KEY, rows[0].id)
    }
  }, [user, activeId])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const setActiveId = useCallback((id: string) => {
    setActiveIdState(id)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOCAL_ACTIVE_KEY, id)
    }
  }, [])

  const create = useCallback<UseResumesReturn['create']>(
    async ({ name, slug, data }) => {
      if (!user) throw new Error('Not signed in.')
      const payload = {
        user_id: user.id,
        name,
        slug,
        data: data ?? emptyResume(),
      }
      const { data: row, error } = await getSupabase()
        .from('resumes')
        .insert(payload)
        .select('*')
        .single<ResumeRow>()
      if (error) throw new Error(error.message)
      setResumes((prev) => [row, ...prev])
      setActiveId(row.id)
      return row
    },
    [user, setActiveId],
  )

  const duplicate = useCallback<UseResumesReturn['duplicate']>(
    async (sourceId, name, slug) => {
      const source = resumes.find((r) => r.id === sourceId)
      if (!source) throw new Error('Source resume not found.')
      return await create({ name, slug, data: source.data })
    },
    [resumes, create],
  )

  const rename = useCallback<UseResumesReturn['rename']>(
    async (id, name) => {
      const { error } = await getSupabase()
        .from('resumes')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw new Error(error.message)
      setResumes((prev) => prev.map((r) => (r.id === id ? { ...r, name } : r)))
    },
    [],
  )

  const remove = useCallback<UseResumesReturn['remove']>(
    async (id) => {
      const { error } = await getSupabase().from('resumes').delete().eq('id', id)
      if (error) throw new Error(error.message)
      setResumes((prev) => {
        const next = prev.filter((r) => r.id !== id)
        if (activeId === id) {
          const fallback = next[0]?.id ?? null
          setActiveIdState(fallback)
          if (fallback && typeof window !== 'undefined') {
            window.localStorage.setItem(LOCAL_ACTIVE_KEY, fallback)
          }
        }
        return next
      })
      // If the user deleted their last resume, auto-create a blank one.
      // Do this outside setResumes so it sees committed state.
      if (!resumes.some((r) => r.id !== id)) {
        await create({ name: 'My resume', slug: 'resume' })
      }
    },
    [activeId, resumes, create],
  )

  return {
    resumes,
    status,
    activeId,
    setActiveId,
    create,
    duplicate,
    rename,
    remove,
    reload: load,
  }
}
