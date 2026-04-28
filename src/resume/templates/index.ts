import type { HtmlTokens, PdfTokens, ResumeTemplate, TemplateId } from './types'
import { classic } from './classic'
import { modern } from './modern'
import { minimal } from './minimal'

export type { TemplateId, ResumeTemplate, HtmlTokens, PdfTokens } from './types'

/**
 * Curated accent palette exposed to the per-resume customizer. Each
 * value is brand-cohesive and reads at body size on white paper. The
 * picker also offers a "default" option that clears the override and
 * lets the active template's own accentColor apply.
 */
export interface AccentSwatch {
  id: string
  label: string
  color: string
}

export const ACCENT_PALETTE: readonly AccentSwatch[] = [
  { id: 'coral', label: 'Coral', color: '#E04D2D' },
  { id: 'indigo', label: 'Indigo', color: '#1F2A44' },
  { id: 'emerald', label: 'Emerald', color: '#0F766E' },
  { id: 'plum', label: 'Plum', color: '#86198F' },
  { id: 'slate', label: 'Slate', color: '#334155' },
  { id: 'amber', label: 'Amber', color: '#A16207' },
]

/**
 * Apply a per-resume accent override on top of a template's tokens.
 * When the template's accentRole is 'none' but the user has chosen a
 * color, force the role to 'sectionHeaders' so the override has a
 * visible target. Leaves both copies of tokens stable when no override
 * is supplied.
 */
export function applyAccentOverride(
  template: ResumeTemplate,
  override: string | undefined,
): { htmlTokens: HtmlTokens; pdfTokens: PdfTokens } {
  if (!override) {
    return { htmlTokens: template.htmlTokens, pdfTokens: template.pdfTokens }
  }
  const role =
    template.htmlTokens.accentRole === 'none'
      ? 'sectionHeaders'
      : template.htmlTokens.accentRole
  return {
    htmlTokens: { ...template.htmlTokens, accentColor: override, accentRole: role },
    pdfTokens: { ...template.pdfTokens, accentColor: override, accentRole: role },
  }
}

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
