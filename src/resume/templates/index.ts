import type { ResumeTemplate, TemplateId } from './types'
import { classic } from './classic'
import { modern } from './modern'
import { minimal } from './minimal'

export type { TemplateId, ResumeTemplate, HtmlTokens, PdfTokens } from './types'

export const DEFAULT_TEMPLATE_ID: TemplateId = 'classic'

export const TEMPLATES: Partial<Record<TemplateId, ResumeTemplate>> = {
  classic,
  modern,
  minimal,
}

// Display order in pickers and switchers.
export const TEMPLATE_LIST: readonly ResumeTemplate[] = [classic, modern, minimal]

export function getTemplate(id: string | undefined | null): ResumeTemplate {
  if (id && id in TEMPLATES) {
    const t = TEMPLATES[id as TemplateId]
    if (t) return t
  }
  return TEMPLATES[DEFAULT_TEMPLATE_ID] as ResumeTemplate
}
