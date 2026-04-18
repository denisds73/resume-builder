export interface ResumePersonal {
  firstName: string
  lastName: string
  title: string
  email: string
  phone?: string
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
  description: string
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
}

export const emptyResume = (): ResumeData => ({
  personal: {
    firstName: '',
    lastName: '',
    title: '',
    email: '',
    phone: '',
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
