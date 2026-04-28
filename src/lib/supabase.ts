import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { ResumeData } from '@/types/resume'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

export type ShareMode = 'off' | 'live' | 'snapshot'

export interface ResumeRow {
  id: string
  user_id: string
  slug: string
  name: string
  data: ResumeData
  share_mode: ShareMode
  published_data: ResumeData | null
  published_at: string | null
  created_at: string
  updated_at: string
  view_count: number
}

export interface ProfileRow {
  user_id: string
  handle: string
  default_template: 'classic' | 'modern' | 'minimal' | null
  created_at: string
}

export interface PublicResumeRow {
  handle: string
  slug: string
  name: string
  data: ResumeData
  share_mode: Exclude<ShareMode, 'off'>
  published_at: string | null
  updated_at: string
  view_count: number
}

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!client) {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase is not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      )
    }
    client = createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  }
  return client
}
