export interface CountryCode {
  /** ISO 3166-1 alpha-2 code — stable key and small UI chip */
  iso: string
  /** Country display name */
  name: string
  /** Dial code with leading `+`, e.g. `+91` */
  code: string
}

/**
 * Curated list of dial codes. India first (primary audience), then the
 * most common English-speaking / startup hub countries, then alphabetical.
 * Not exhaustive — adding more as needed is cheap.
 */
export const COUNTRY_CODES: CountryCode[] = [
  // Priority group
  { iso: 'IN', name: 'India', code: '+91' },
  { iso: 'US', name: 'United States', code: '+1' },
  { iso: 'GB', name: 'United Kingdom', code: '+44' },
  { iso: 'CA', name: 'Canada', code: '+1' },
  { iso: 'AU', name: 'Australia', code: '+61' },
  { iso: 'SG', name: 'Singapore', code: '+65' },
  { iso: 'AE', name: 'United Arab Emirates', code: '+971' },
  { iso: 'DE', name: 'Germany', code: '+49' },

  // Alphabetical rest
  { iso: 'AF', name: 'Afghanistan', code: '+93' },
  { iso: 'AR', name: 'Argentina', code: '+54' },
  { iso: 'AT', name: 'Austria', code: '+43' },
  { iso: 'BH', name: 'Bahrain', code: '+973' },
  { iso: 'BD', name: 'Bangladesh', code: '+880' },
  { iso: 'BE', name: 'Belgium', code: '+32' },
  { iso: 'BR', name: 'Brazil', code: '+55' },
  { iso: 'BG', name: 'Bulgaria', code: '+359' },
  { iso: 'CN', name: 'China', code: '+86' },
  { iso: 'CO', name: 'Colombia', code: '+57' },
  { iso: 'CZ', name: 'Czechia', code: '+420' },
  { iso: 'DK', name: 'Denmark', code: '+45' },
  { iso: 'EG', name: 'Egypt', code: '+20' },
  { iso: 'FI', name: 'Finland', code: '+358' },
  { iso: 'FR', name: 'France', code: '+33' },
  { iso: 'GR', name: 'Greece', code: '+30' },
  { iso: 'HK', name: 'Hong Kong', code: '+852' },
  { iso: 'HU', name: 'Hungary', code: '+36' },
  { iso: 'ID', name: 'Indonesia', code: '+62' },
  { iso: 'IE', name: 'Ireland', code: '+353' },
  { iso: 'IL', name: 'Israel', code: '+972' },
  { iso: 'IT', name: 'Italy', code: '+39' },
  { iso: 'JP', name: 'Japan', code: '+81' },
  { iso: 'KR', name: 'South Korea', code: '+82' },
  { iso: 'KW', name: 'Kuwait', code: '+965' },
  { iso: 'LK', name: 'Sri Lanka', code: '+94' },
  { iso: 'MY', name: 'Malaysia', code: '+60' },
  { iso: 'MX', name: 'Mexico', code: '+52' },
  { iso: 'NL', name: 'Netherlands', code: '+31' },
  { iso: 'NZ', name: 'New Zealand', code: '+64' },
  { iso: 'NG', name: 'Nigeria', code: '+234' },
  { iso: 'NO', name: 'Norway', code: '+47' },
  { iso: 'OM', name: 'Oman', code: '+968' },
  { iso: 'PK', name: 'Pakistan', code: '+92' },
  { iso: 'PH', name: 'Philippines', code: '+63' },
  { iso: 'PL', name: 'Poland', code: '+48' },
  { iso: 'PT', name: 'Portugal', code: '+351' },
  { iso: 'QA', name: 'Qatar', code: '+974' },
  { iso: 'RO', name: 'Romania', code: '+40' },
  { iso: 'SA', name: 'Saudi Arabia', code: '+966' },
  { iso: 'ZA', name: 'South Africa', code: '+27' },
  { iso: 'ES', name: 'Spain', code: '+34' },
  { iso: 'SE', name: 'Sweden', code: '+46' },
  { iso: 'CH', name: 'Switzerland', code: '+41' },
  { iso: 'TW', name: 'Taiwan', code: '+886' },
  { iso: 'TH', name: 'Thailand', code: '+66' },
  { iso: 'TR', name: 'Turkey', code: '+90' },
  { iso: 'UA', name: 'Ukraine', code: '+380' },
  { iso: 'VN', name: 'Vietnam', code: '+84' },
]

export const DEFAULT_COUNTRY = COUNTRY_CODES[0] // India

// Pre-sorted by dial code length descending, so longest prefix wins when
// parsing stored values (e.g. `+971` must match before `+97` or `+9`).
const SORTED_CODES = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length)

export interface ParsedPhone {
  country: CountryCode
  local: string
}

/**
 * Split a stored phone string (e.g. `+91 98765 43210`) into its country
 * code and local-number parts. If the value doesn't start with a known
 * dial code, falls back to the default country and keeps the full value
 * as the local number — so existing resumes with bare numbers (`98765
 * 43210`) still render cleanly.
 */
export function parsePhone(stored: string | undefined | null): ParsedPhone {
  const trimmed = (stored ?? '').trim()
  if (!trimmed) return { country: DEFAULT_COUNTRY, local: '' }

  for (const c of SORTED_CODES) {
    if (trimmed.startsWith(c.code)) {
      return { country: c, local: trimmed.slice(c.code.length).trim() }
    }
  }
  return { country: DEFAULT_COUNTRY, local: trimmed }
}

/**
 * Recombine into the canonical stored format: `${code} ${local}`.
 *
 * When the local part is blank:
 *   - Default country (+91) → return `''` so "no phone" round-trips as
 *     the empty string and nothing noisy lands in the stored data.
 *   - Non-default country → return just the dial code so the user's
 *     explicit country selection is preserved across re-renders.
 *     Without this, picking a country before typing a number would
 *     silently reset back to +91 (the parsed default for empty values).
 */
export function formatPhone(country: CountryCode, local: string): string {
  const clean = local.trim()
  if (clean) return `${country.code} ${clean}`
  if (country.iso === DEFAULT_COUNTRY.iso) return ''
  return country.code
}
