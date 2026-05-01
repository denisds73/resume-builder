import { Input, PhoneInput } from '@/components/ui'
import { useField } from '@/hooks/useField'
import type { ResumePersonal } from '@/types/resume'
import { parsePhone } from '@/lib/countryCodes'
import {
  composeValidators,
  validateEmail,
  validateMaxLength,
  validatePhoneLocal,
  validateUrl,
} from '@/lib/validators'

interface Props {
  value: ResumePersonal
  onChange: (next: ResumePersonal) => void
}

export default function PersonalInfoEditor({ value, onChange }: Props) {
  const update = <K extends keyof ResumePersonal>(key: K, v: ResumePersonal[K]) => {
    onChange({ ...value, [key]: v })
  }

  // `phoneIsWhatsapp` is undefined on older resumes — treat as true so their
  // existing WhatsApp button behavior is preserved.
  const phoneIsWhatsapp = value.phoneIsWhatsapp !== false

  // Validators run against the local part of phone/whatsapp (the part the
  // user actually types — not the canonical "+91 98765" stored string).
  const phoneLocal = parsePhone(value.phone).local
  const waLocal = parsePhone(value.whatsapp).local

  const firstName = useField(value.firstName, (v) => validateMaxLength(v, 60))
  const lastName = useField(value.lastName, (v) => validateMaxLength(v, 60))
  const title = useField(value.title, (v) => validateMaxLength(v, 100))
  const email = useField(value.email, validateEmail)
  const phone = useField(phoneLocal, validatePhoneLocal)
  const whatsapp = useField(waLocal, validatePhoneLocal)
  const location = useField(value.location ?? '', (v) => validateMaxLength(v, 100))
  const website = useField(value.website ?? '', (v) => validateUrl(v))
  const linkedin = useField(value.linkedin ?? '', (v) =>
    composeValidators(
      (x) => validateUrl(x, 'linkedin.com'),
    )(v),
  )
  const github = useField(value.github ?? '', (v) =>
    composeValidators(
      (x) => validateUrl(x, 'github.com'),
    )(v),
  )
  const leetcode = useField(value.leetcode ?? '', (v) =>
    composeValidators(
      (x) => validateUrl(x, 'leetcode.com'),
    )(v),
  )

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <header className="mb-5">
        <h2 className="font-display text-xl text-text-primary">Personal Information</h2>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="First Name"
          value={value.firstName}
          onChange={(e) => update('firstName', e.target.value)}
          onBlur={firstName.onBlur}
          error={firstName.error}
        />
        <Input
          label="Last Name"
          value={value.lastName}
          onChange={(e) => update('lastName', e.target.value)}
          onBlur={lastName.onBlur}
          error={lastName.error}
        />
        <Input
          label="Title / Role"
          placeholder="e.g. Frontend Engineer"
          value={value.title}
          onChange={(e) => update('title', e.target.value)}
          onBlur={title.onBlur}
          error={title.error}
          className="sm:col-span-2"
        />
        <Input
          label="Email"
          type="email"
          value={value.email}
          onChange={(e) => update('email', e.target.value)}
          onBlur={email.onBlur}
          error={email.error}
        />
        <div className="relative">
          <PhoneInput
            label="Phone"
            placeholder="98765 43210"
            value={value.phone ?? ''}
            onChange={(v) => update('phone', v)}
            onBlur={phone.onBlur}
            error={phone.error}
          />
          <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-xs text-text-secondary">
            <input
              type="checkbox"
              checked={phoneIsWhatsapp}
              onChange={(e) => update('phoneIsWhatsapp', e.target.checked)}
              className="h-3.5 w-3.5 cursor-pointer accent-accent"
            />
            <span>This number is also on WhatsApp</span>
          </label>
        </div>
        {!phoneIsWhatsapp && (
          <div className="relative">
            <PhoneInput
              label="WhatsApp number"
              placeholder="98765 43210"
              helper="Leave blank if you're not on WhatsApp."
              value={value.whatsapp ?? ''}
              onChange={(v) => update('whatsapp', v)}
              onBlur={whatsapp.onBlur}
              error={whatsapp.error}
            />
          </div>
        )}
        <Input
          label="Location"
          placeholder="City, Country"
          value={value.location ?? ''}
          onChange={(e) => update('location', e.target.value)}
          onBlur={location.onBlur}
          error={location.error}
        />
        <Input
          label="Portfolio URL"
          placeholder="https://…"
          value={value.website ?? ''}
          onChange={(e) => update('website', e.target.value)}
          onBlur={website.onBlur}
          error={website.error}
        />
        <Input
          label="LinkedIn"
          placeholder="linkedin.com/in/…"
          value={value.linkedin ?? ''}
          onChange={(e) => update('linkedin', e.target.value)}
          onBlur={linkedin.onBlur}
          error={linkedin.error}
        />
        <Input
          label="GitHub"
          placeholder="github.com/…"
          value={value.github ?? ''}
          onChange={(e) => update('github', e.target.value)}
          onBlur={github.onBlur}
          error={github.error}
        />
        <Input
          label="LeetCode"
          placeholder="leetcode.com/u/…"
          value={value.leetcode ?? ''}
          onChange={(e) => update('leetcode', e.target.value)}
          onBlur={leetcode.onBlur}
          error={leetcode.error}
        />
      </div>
    </section>
  )
}
