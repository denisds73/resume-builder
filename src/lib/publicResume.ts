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
  try {
    await getSupabase().rpc('increment_resume_view', {
      p_handle: handle,
      p_slug: slug,
    })
  } catch {
    // Counter is best-effort — a transient network hiccup shouldn't bubble
    // into the public view. The recruiter never knows it failed.
  }
}
