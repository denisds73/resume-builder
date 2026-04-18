import type { ResumeData } from '@/types/resume'

export type SectionKey =
  | 'personal'
  | 'summary'
  | 'skills'
  | 'experience'
  | 'projects'
  | 'education'
  | 'certifications'

export interface SectionSpec {
  key: SectionKey
  kicker: string
  label: string
  optional?: boolean
}

export const SECTIONS: SectionSpec[] = [
  { key: 'personal', kicker: '01', label: 'Personal' },
  { key: 'summary', kicker: '02', label: 'Summary' },
  { key: 'skills', kicker: '03', label: 'Skills' },
  { key: 'experience', kicker: '04', label: 'Experience' },
  { key: 'projects', kicker: '05', label: 'Projects' },
  { key: 'education', kicker: '06', label: 'Education', optional: true },
  { key: 'certifications', kicker: '07', label: 'Certifications', optional: true },
]

export function isSectionComplete(data: ResumeData, key: SectionKey): boolean {
  switch (key) {
    case 'personal': {
      const { firstName, lastName, email } = data.personal
      const hasName = Boolean(firstName.trim() || lastName.trim())
      return hasName && Boolean(email.trim())
    }
    case 'summary':
      return data.summary.trim().length > 0
    case 'skills':
      return data.skills.some((g) => g.category.trim() && g.skills.length > 0)
    case 'experience':
      return data.experience.some((e) => e.company.trim() || e.role.trim())
    case 'projects':
      return data.projects.some((p) => p.name.trim())
    case 'education':
      return data.education.some((e) => e.school.trim() || e.degree.trim())
    case 'certifications':
      return data.certifications.some((c) => c.name.trim())
  }
}

export function getSectionIndex(key: SectionKey): number {
  return SECTIONS.findIndex((s) => s.key === key)
}

export function isValidSection(v: string | null | undefined): v is SectionKey {
  if (!v) return false
  return SECTIONS.some((s) => s.key === v)
}
