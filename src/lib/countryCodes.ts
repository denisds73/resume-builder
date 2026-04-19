export interface CountryCode {
  /** ISO 3166-1 alpha-2 code — used only as a stable key */
  iso: string
  /** Country display name */
  name: string
  /** Dial code with leading `+`, e.g. `+91` */
  code: string
  /** Emoji flag — zero bundle cost, universally rendered */
  flag: string
}

/**
 * Curated list of dial codes. India first (primary audience), then the
 * most common English-speaking / startup hub countries, then alphabetical.
 * Not exhaustive — adding more as needed is cheap.
 */
export const COUNTRY_CODES: CountryCode[] = [
  // Priority group
  { iso: 'IN', name: 'India', code: '+91', flag: '🇮🇳' },
  { iso: 'US', name: 'United States', code: '+1', flag: '🇺🇸' },
  { iso: 'GB', name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { iso: 'CA', name: 'Canada', code: '+1', flag: '🇨🇦' },
  { iso: 'AU', name: 'Australia', code: '+61', flag: '🇦🇺' },
  { iso: 'SG', name: 'Singapore', code: '+65', flag: '🇸🇬' },
  { iso: 'AE', name: 'United Arab Emirates', code: '+971', flag: '🇦🇪' },
  { iso: 'DE', name: 'Germany', code: '+49', flag: '🇩🇪' },

  // Alphabetical rest
  { iso: 'AF', name: 'Afghanistan', code: '+93', flag: '🇦🇫' },
  { iso: 'AR', name: 'Argentina', code: '+54', flag: '🇦🇷' },
  { iso: 'AT', name: 'Austria', code: '+43', flag: '🇦🇹' },
  { iso: 'BH', name: 'Bahrain', code: '+973', flag: '🇧🇭' },
  { iso: 'BD', name: 'Bangladesh', code: '+880', flag: '🇧🇩' },
  { iso: 'BE', name: 'Belgium', code: '+32', flag: '🇧🇪' },
  { iso: 'BR', name: 'Brazil', code: '+55', flag: '🇧🇷' },
  { iso: 'BG', name: 'Bulgaria', code: '+359', flag: '🇧🇬' },
  { iso: 'CN', name: 'China', code: '+86', flag: '🇨🇳' },
  { iso: 'CO', name: 'Colombia', code: '+57', flag: '🇨🇴' },
  { iso: 'CZ', name: 'Czechia', code: '+420', flag: '🇨🇿' },
  { iso: 'DK', name: 'Denmark', code: '+45', flag: '🇩🇰' },
  { iso: 'EG', name: 'Egypt', code: '+20', flag: '🇪🇬' },
  { iso: 'FI', name: 'Finland', code: '+358', flag: '🇫🇮' },
  { iso: 'FR', name: 'France', code: '+33', flag: '🇫🇷' },
  { iso: 'GR', name: 'Greece', code: '+30', flag: '🇬🇷' },
  { iso: 'HK', name: 'Hong Kong', code: '+852', flag: '🇭🇰' },
  { iso: 'HU', name: 'Hungary', code: '+36', flag: '🇭🇺' },
  { iso: 'ID', name: 'Indonesia', code: '+62', flag: '🇮🇩' },
  { iso: 'IE', name: 'Ireland', code: '+353', flag: '🇮🇪' },
  { iso: 'IL', name: 'Israel', code: '+972', flag: '🇮🇱' },
  { iso: 'IT', name: 'Italy', code: '+39', flag: '🇮🇹' },
  { iso: 'JP', name: 'Japan', code: '+81', flag: '🇯🇵' },
  { iso: 'KR', name: 'South Korea', code: '+82', flag: '🇰🇷' },
  { iso: 'KW', name: 'Kuwait', code: '+965', flag: '🇰🇼' },
  { iso: 'LK', name: 'Sri Lanka', code: '+94', flag: '🇱🇰' },
  { iso: 'MY', name: 'Malaysia', code: '+60', flag: '🇲🇾' },
  { iso: 'MX', name: 'Mexico', code: '+52', flag: '🇲🇽' },
  { iso: 'NL', name: 'Netherlands', code: '+31', flag: '🇳🇱' },
  { iso: 'NZ', name: 'New Zealand', code: '+64', flag: '🇳🇿' },
  { iso: 'NG', name: 'Nigeria', code: '+234', flag: '🇳🇬' },
  { iso: 'NO', name: 'Norway', code: '+47', flag: '🇳🇴' },
  { iso: 'OM', name: 'Oman', code: '+968', flag: '🇴🇲' },
  { iso: 'PK', name: 'Pakistan', code: '+92', flag: '🇵🇰' },
  { iso: 'PH', name: 'Philippines', code: '+63', flag: '🇵🇭' },
  { iso: 'PL', name: 'Poland', code: '+48', flag: '🇵🇱' },
  { iso: 'PT', name: 'Portugal', code: '+351', flag: '🇵🇹' },
  { iso: 'QA', name: 'Qatar', code: '+974', flag: '🇶🇦' },
  { iso: 'RO', name: 'Romania', code: '+40', flag: '🇷🇴' },
  { iso: 'SA', name: 'Saudi Arabia', code: '+966', flag: '🇸🇦' },
  { iso: 'ZA', name: 'South Africa', code: '+27', flag: '🇿🇦' },
  { iso: 'ES', name: 'Spain', code: '+34', flag: '🇪🇸' },
  { iso: 'SE', name: 'Sweden', code: '+46', flag: '🇸🇪' },
  { iso: 'CH', name: 'Switzerland', code: '+41', flag: '🇨🇭' },
  { iso: 'TW', name: 'Taiwan', code: '+886', flag: '🇹🇼' },
  { iso: 'TH', name: 'Thailand', code: '+66', flag: '🇹🇭' },
  { iso: 'TR', name: 'Turkey', code: '+90', flag: '🇹🇷' },
  { iso: 'UA', name: 'Ukraine', code: '+380', flag: '🇺🇦' },
  { iso: 'VN', name: 'Vietnam', code: '+84', flag: '🇻🇳' },
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
 * Recombine into the canonical stored format: `${code} ${local}`. Returns
 * an empty string when the local part is blank so the field can represent
 * "no phone" as the empty string instead of a bare `+91`.
 */
export function formatPhone(country: CountryCode, local: string): string {
  const clean = local.trim()
  return clean ? `${country.code} ${clean}` : ''
}
