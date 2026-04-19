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
