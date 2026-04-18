import { useCallback, useEffect, useState } from 'react'
import { getSupabase, isSupabaseConfigured, type ProfileRow } from '@/lib/supabase'
import { useAuth } from './useAuth'

type Status = 'idle' | 'loading' | 'ready' | 'error'

export interface UseProfileReturn {
  handle: string | null
  status: Status
  claim: (handle: string) => Promise<void>
  reload: () => Promise<void>
}

export function useProfile(): UseProfileReturn {
  const { user } = useAuth()
  const [handle, setHandle] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !user) {
      setHandle(null)
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

  return { handle, status, claim, reload: load }
}
