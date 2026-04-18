import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { ResumeData } from '@/types/resume'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

export interface ResumeRow {
  user_id: string
  data: ResumeData
  updated_at: string
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
