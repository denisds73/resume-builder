import type { ResumeTemplate, TemplateId } from './types'
import { classic } from './classic'

export type { TemplateId, ResumeTemplate, HtmlTokens, PdfTokens } from './types'

export const DEFAULT_TEMPLATE_ID: TemplateId = 'classic'

// Only registered templates appear here. Future templates (`modern`, `minimal`)
// land in upcoming PRs. Unknown ids fall back to the default via getTemplate.
export const TEMPLATES: Partial<Record<TemplateId, ResumeTemplate>> = {
  classic,
}

export const TEMPLATE_LIST: readonly ResumeTemplate[] = [classic]

export function getTemplate(id: string | undefined | null): ResumeTemplate {
  if (id && id in TEMPLATES) {
    const t = TEMPLATES[id as TemplateId]
    if (t) return t
  }
  return TEMPLATES[DEFAULT_TEMPLATE_ID] as ResumeTemplate
}
