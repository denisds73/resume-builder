import type { ResumeData } from '@/types/resume'

/**
 * Normalize a stored ResumeData row on load. Converts the pre-bullets
 * `description` (projects) and `notes` (education) free-text fields into
 * `bullets: string[]` so downstream code (editors + document render) can
 * assume a single canonical shape. Idempotent — safe to run repeatedly.
 *
 * Splits on newlines, strips leading bullet glyphs (`•`, `-`, `*`), and
 * trims whitespace. Mirrors the parser already used by ResumeDocument's
 * `bulletsFromText`, so old PDFs and migrated bullets match exactly.
 */
function splitToBullets(text: string | undefined | null): string[] {
  if (!text) return []
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[•\-*]\s*/, '').trim())
    .filter(Boolean)
}

type LegacyExperience = {
  bullets?: unknown
  bulletProjects?: unknown
  projectGroups?: unknown
  projects?: unknown
} & Record<string, unknown>

function normalizeExperience(raw: unknown): import('@/types/resume').ResumeExperienceEntry {
  const e = (raw ?? {}) as LegacyExperience
  if (Array.isArray(e.projects) && e.projects.length > 0) {
    return e as unknown as import('@/types/resume').ResumeExperienceEntry
  }
  const blocks: import('@/types/resume').ResumeProjectGroup[] = []
  if (Array.isArray(e.bullets) && e.bullets.length > 0) {
    blocks.push({
      id: crypto.randomUUID(),
      name: '',
      bullets: (e.bullets as unknown[]).map(String),
    })
  }
  if (Array.isArray(e.projectGroups)) {
    for (const g of e.projectGroups as Array<{ id?: string; name?: string; bullets?: unknown }>) {
      blocks.push({
        id: g.id ?? crypto.randomUUID(),
        name: typeof g.name === 'string' ? g.name : '',
        bullets: Array.isArray(g.bullets) ? (g.bullets as unknown[]).map(String) : [''],
      })
    }
  }
  if (blocks.length === 0) {
    blocks.push({ id: crypto.randomUUID(), name: '', bullets: [''] })
  }
  // Strip legacy fields so downstream code only sees the new shape.
  const { bullets: _b, bulletProjects: _bp, projectGroups: _pg, ...rest } = e
  void _b; void _bp; void _pg
  return { ...(rest as object), projects: blocks } as import('@/types/resume').ResumeExperienceEntry
}

export function migrateResumeData(data: ResumeData): ResumeData {
  // Defensive: stored jsonb may be missing these arrays on pre-launch
  // rows or after a partial write. Unhandled exceptions here used to
  // leak out of the load promise and strand the editor in 'loading'.
  try {
    const projects = Array.isArray(data.projects)
      ? data.projects.map((p) => {
          if (p.bullets && p.bullets.length > 0) return p
          if (p.description && p.description.trim()) {
            return { ...p, bullets: splitToBullets(p.description) }
          }
          return { ...p, bullets: [''] }
        })
      : []
    const experience = Array.isArray(data.experience)
      ? data.experience.map((e) => normalizeExperience(e))
      : []
    const education = Array.isArray(data.education)
      ? data.education.map((e) => {
          if (e.bullets && e.bullets.length > 0) return e
          if (e.notes && e.notes.trim()) {
            return { ...e, bullets: splitToBullets(e.notes) }
          }
          return e
        })
      : []
    return { ...data, projects, experience, education }
  } catch {
    // Shouldn't happen with the Array.isArray guards, but never let a
    // migration bug block the editor from loading.
    return data
  }
}
