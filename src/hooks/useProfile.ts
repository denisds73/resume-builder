import { useCallback, useEffect, useState } from 'react'
import { getSupabase, isSupabaseConfigured, type ProfileRow } from '@/lib/supabase'
import type { TemplateId } from '@/resume/templates'
import { useAuth } from './useAuth'

type Status = 'idle' | 'loading' | 'ready' | 'error'

export interface UseProfileReturn {
  handle: string | null
  defaultTemplate: TemplateId | null
  status: Status
  claim: (handle: string) => Promise<void>
  setDefaultTemplate: (id: TemplateId) => Promise<void>
  reload: () => Promise<void>
}

export function useProfile(): UseProfileReturn {
  const { user } = useAuth()
  const [handle, setHandle] = useState<string | null>(null)
  const [defaultTemplate, setDefaultTemplateState] = useState<TemplateId | null>(null)
  const [status, setStatus] = useState<Status>('idle')

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !user) {
      setHandle(null)
      setDefaultTemplateState(null)
      setStatus('idle')
      return
    }
    setStatus('loading')
    const { data, error } = await getSupabase()
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle<ProfileRow>()
    if (error) {
      setStatus('error')
      return
    }
    setHandle(data?.handle ?? null)
    setDefaultTemplateState((data?.default_template as TemplateId | null) ?? null)
    setStatus('ready')
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  const claim = useCallback(
    async (newHandle: string) => {
      if (!isSupabaseConfigured || !user) throw new Error('Not signed in.')
      const { error } = await getSupabase().rpc('claim_handle', { new_handle: newHandle })
      if (error) throw new Error(error.message || 'Handle claim failed.')
      setHandle(newHandle)
    },
    [user],
  )

  const setDefaultTemplate = useCallback(
    async (id: TemplateId) => {
      if (!isSupabaseConfigured || !user) throw new Error('Not signed in.')
      const { error } = await getSupabase()
        .from('profiles')
        .update({ default_template: id })
        .eq('user_id', user.id)
      if (error) throw new Error(error.message || 'Could not save default template.')
      setDefaultTemplateState(id)
    },
    [user],
  )

  return {
    handle,
    defaultTemplate,
    status,
    claim,
    setDefaultTemplate,
    reload: load,
  }
}
