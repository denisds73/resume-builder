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
    const education = Array.isArray(data.education)
      ? data.education.map((e) => {
          if (e.bullets && e.bullets.length > 0) return e
          if (e.notes && e.notes.trim()) {
            return { ...e, bullets: splitToBullets(e.notes) }
          }
          return e
        })
      : []
    return { ...data, projects, education }
  } catch {
    // Shouldn't happen with the Array.isArray guards, but never let a
    // migration bug block the editor from loading.
    return data
  }
}
