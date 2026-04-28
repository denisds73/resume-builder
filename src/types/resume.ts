import type { TemplateId } from '@/resume/templates'

export interface ResumePersonal {
  firstName: string
  lastName: string
  title: string
  email: string
  phone?: string
  /**
   * Whether the `phone` number is also the candidate's WhatsApp contact.
   * Undefined is treated as `true` for backward compatibility with resumes
   * created before this field existed.
   */
  phoneIsWhatsapp?: boolean
  /**
   * Explicit WhatsApp number, used when the candidate's phone is different
   * from their WhatsApp number (i.e. `phoneIsWhatsapp === false`). Takes
   * precedence over `phone` for the public WhatsApp action button.
   */
  whatsapp?: string
  location?: string
  website?: string
  linkedin?: string
  github?: string
  leetcode?: string
}

export interface ResumeExperienceEntry {
  id: string
  company: string
  role: string
  location?: string
  startDate: string | null
  endDate: string | null
  bullets: string[]
}

export interface ResumeEducationEntry {
  id: string
  school: string
  degree: string
  field?: string
  startDate: string | null
  endDate: string | null
  /** Bullet points (honors, GPA, relevant coursework). */
  bullets?: string[]
  /** @deprecated pre-bullets free-text notes. Kept for backward compatibility — normalized into `bullets` on load. */
  notes?: string
}

export interface ResumeSkillGroup {
  id: string
  category: string
  skills: string[]
}

export interface ResumeProjectEntry {
  id: string
  name: string
  url?: string
  /** Bullet points describing what the project is and what the candidate did. */
  bullets?: string[]
  /** @deprecated pre-bullets free-text description. Kept for backward compatibility — normalized into `bullets` on load. */
  description?: string
  tech: string[]
}

export interface ResumeCertEntry {
  id: string
  name: string
  issuer: string
  date: string
  url?: string
}

export interface ResumeData {
  personal: ResumePersonal
  summary: string
  experience: ResumeExperienceEntry[]
  education: ResumeEducationEntry[]
  skills: ResumeSkillGroup[]
  projects: ResumeProjectEntry[]
  certifications: ResumeCertEntry[]
  /**
   * Visual template applied to the resume. Optional for backward compatibility —
   * resumes saved before templates existed render with the default template
   * (see `getTemplate` in `@/resume/templates`).
   */
  templateId?: TemplateId
  /**
   * Per-resume accent color override (CSS hex). When unset, the active
   * template's `accentColor` is used. Templates whose `accentRole` is
   * 'none' adopt 'sectionHeaders' implicitly when an override is set,
   * so the user sees their pick.
   */
  accentColor?: string
}

export const emptyResume = (): ResumeData => ({
  personal: {
    firstName: '',
    lastName: '',
    title: '',
    email: '',
    phone: '',
    phoneIsWhatsapp: true,
    whatsapp: '',
    location: '',
    website: '',
    linkedin: '',
    github: '',
    leetcode: '',
  },
  summary: '',
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
})
