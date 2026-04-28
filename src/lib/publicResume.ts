import { getSupabase, isSupabaseConfigured, type PublicResumeRow } from '@/lib/supabase'

export async function fetchPublicResume(
  handle: string,
  slug: string,
): Promise<PublicResumeRow | null> {
  if (!isSupabaseConfigured) return null
  const { data, error } = await getSupabase()
    .from('public_resumes')
    .select('*')
    .eq('handle', handle)
    .eq('slug', slug)
    .maybeSingle<PublicResumeRow>()
  if (error) return null
  return data ?? null
}

// One view per resume per browser session. We don't track who viewed —
// only that *somebody* did, ever. Recruiter scroll-throughs and the owner
// previewing their own link both count once.
export async function recordResumeView(handle: string, slug: string): Promise<void> {
  if (!isSupabaseConfigured) return
  const key = `view:${handle}/${slug}`
  try {
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
  } catch {
    // sessionStorage can throw in private modes; if it does we just skip
    // the dedup and accept the worst case (bumps once per refresh).
  }
  // supabase-js returns RPC errors as `{ error }` on the response — they
  // don't throw. The try/catch only protects against network/transport
  // failures; PostgREST errors (404 function-not-found, 403 forbidden,
  // schema cache miss) come back here as `error`.
  try {
    const { error } = await getSupabase().rpc('increment_resume_view', {
      p_handle: handle,
      p_slug: slug,
    })
    if (error && import.meta.env.DEV) {
      console.warn('[recordResumeView] RPC failed:', error)
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[recordResumeView] transport error:', err)
    }
  }
}
