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
  return {
    ...data,
    projects: data.projects.map((p) => {
      if (p.bullets && p.bullets.length > 0) return p
      if (p.description && p.description.trim()) {
        return { ...p, bullets: splitToBullets(p.description) }
      }
      return { ...p, bullets: [''] }
    }),
    education: data.education.map((e) => {
      if (e.bullets && e.bullets.length > 0) return e
      if (e.notes && e.notes.trim()) {
        return { ...e, bullets: splitToBullets(e.notes) }
      }
      return e
    }),
  }
}
