# Resumefolio — Sprint-Based Development Plan

## Context

Resumefolio is a live React + TS + Tailwind v4 + Supabase resume builder (resumef.vercel.app). The product is past MVP. The prior analysis pass produced three streams — UI/UX improvements, premium features for monetization, and growth levers — which this document sequences into executable two-week sprints.

**Operating model**: solo / small team, two-week sprints, one feature branch per item, PR per item, squash-merge. Each sprint targets ~5–8 working days of focused effort so there's headroom for interruptions. "Stretch" items can move to the next sprint without slipping the core goal.

**Tracking**: the Goal sentence is the definition of done for the sprint. Each item has an acceptance criterion that is testable without ambiguity.

---

## Sprint 0 — Prep & Tech Debt (1 week)

**Goal**: clear small debt so Sprint 1+ can move faster. Nothing user-visible.

| # | Item | Acceptance criterion | Primary files |
|---|---|---|---|
| 0.1 | Bundle split — lazy-load `framer-motion`, `react-to-print`, Supabase client | `dist/assets/index-*.js` gzipped < 170 KB; public view LCP improves | `src/App.tsx`, `vite.config.ts` |
| 0.2 | Wire field-level validation everywhere | Every editor surfaces errors from `src/lib/validators.ts` with inline red helper text on blur | `PersonalInfoEditor.tsx`, `ProjectsEditor.tsx`, `CertificationsEditor.tsx` |
| 0.3 | Modal keyboard traps + focus return | Rename, delete, new-resume, share-panel all trap focus; return to trigger on close | `ResumeBuilder.tsx`, `SharePanel.tsx`, `NewResumeDialog.tsx` |

**Exit**: lighthouse on public view ≥ 90, zero missing-validation console complaints during internal walkthrough.

---

## Sprint 1 — Trust Foundations (2 weeks)

**Goal**: remove the two biggest trust gaps in the editor — irreversibility and stiffness.

| # | Item | Acceptance criterion | Primary files |
|---|---|---|---|
| 1.1 | Drag-to-reorder entries (`@hello-pangea/dnd` is already installed) | Experience, Projects, Education, Certifications, Skill groups, and bullets all reorder via drag; order persists on reload | `RepeatableSection.tsx`, `BulletsEditor.tsx`, `SkillsEditor.tsx` |
| 1.2 | Undo / redo (20-step ring buffer, scoped to active resume) | Cmd-Z / Cmd-Shift-Z cycles through last 20 states; toast confirms; history cleared on resume switch | `useActiveResume.ts` (new `useHistory` helper) |
| 1.3 | Autosave microcopy + aria-live polite region | Saving status is announced to screen readers; "Saved 2m ago" replaced with richer "All changes synced" when idle | `ResumeBuilder.tsx` |
| 1.4 *(stretch)* | Spellcheck audit + `lang="en"` on document | All textareas have `spellCheck={true}`; html has `lang="en"` | `index.html`, each editor |

**Exit**: friendly-user demo — reorder a dozen bullets, undo to original, save indicator tracks correctly.

---

## Sprint 2 — Shareable Virality (2 weeks)

**Goal**: every share of a public URL is a billboard. Close the OG card gap and add low-friction share surfaces.

| # | Item | Acceptance criterion | Primary files |
|---|---|---|---|
| 2.1 | Dynamic OG preview card via Vercel Edge route | `/api/og/[handle]/[slug]` returns a 1200×630 PNG with name, title, and 3 recent roles; LinkedIn / WhatsApp / Slack paste renders correctly | new `api/og/[handle]/[slug].ts`, `PublicResume.tsx` meta tags |
| 2.2 | Short link + QR code in Share Panel | One-click copy of short link (`/r/xyz` → resolves to `/@handle/slug`) and inline QR download | `SharePanel.tsx`, Supabase `short_links` table, `/r/:code` route |
| 2.3 | Plaintext / ATS export | "Copy as plain text" action in Share Panel; produces a clean text-only version | `src/lib/resumePlainText.ts` (new), `SharePanel.tsx` |
| 2.4 | Referral attribution on "Made with Resumefolio" footer | Footer link carries `?ref={handle}`; signup pre-fills referrer; dashboard chip if attributed | `PublicResume.tsx`, `ResumeBuilder.tsx`, new `referred_by` column on `profiles` |

**Exit**: pasting your own public URL into LinkedIn and WhatsApp both render rich preview cards.

---

## Sprint 3 — Editor Power & Onboarding (2 weeks)

**Goal**: new users don't stare at a blank form; power users have keyboard-first ergonomics.

| # | Item | Acceptance criterion | Primary files |
|---|---|---|---|
| 3.1 | Command palette (⌘K) | Jump to section, switch resume, toggle share, download PDF, copy URL, new resume — all accessible via palette | new `src/components/CommandPalette.tsx` |
| 3.2 | Empty-state first run | First-ever resume offers "Start from example", "Paste JSON", "Start blank"; example seed lives in `src/data/exampleResume.ts` | `ResumeBuilder.tsx`, new seed data |
| 3.3 | Inline ATS readiness chip in preview chrome | "08/10 ready" chip opens dropdown listing specific misses (no email, 0 bullets on role, summary too long) | new `src/lib/atsScore.ts`, `ResumePreview.tsx` |
| 3.4 *(stretch)* | Weak-verb + bullet-length linter | Bullets beginning with "Responsible for", "Worked on" get subtle ochre underline and tooltip; >180 char warning | new `src/lib/bulletLinter.tsx`, `BulletsEditor.tsx` |

**Exit**: a brand-new signup can land → hit ⌘K → pick "Start from example" → see a 9/10 ATS score within 60 seconds.

---

## Sprint 4 — Template Foundation (2 weeks)

**Goal**: lift the first monetization lever — templates. Refactor `ResumeDocument` so swapping a template is a one-prop change.

| # | Item | Acceptance criterion | Primary files |
|---|---|---|---|
| 4.1 | Refactor `ResumeDocument` to accept `template` and `theme` props | Current design becomes "Editorial"; swapping `template="classic"` renders a second layout; no regressions in print | `ResumeDocument.tsx` → `templates/Editorial.tsx`, new `templates/Classic.tsx` |
| 4.2 | Template picker UI in the editor | Dropdown or segmented control in the preview chrome; selection persists per resume | new `template` column on `resumes`, `ResumePreview.tsx` |
| 4.3 | Accent color variants (6 presets) | Free tier: 2 colors. Rest are Pro-gated (gate shipped Sprint 6) | `globals.css` tokens, `src/styles/accent.ts` |
| 4.4 *(stretch)* | Font pair picker (3 pairs) | Same pattern as accent colors; first pair free | `ResumeDocument.tsx` |

**Exit**: user can pick between two templates and two accent colors; PDF output of both looks hand-crafted.

---

## Sprint 5 — Light/Dark + Mobile Read (2 weeks)

**Goal**: unlock the ~40% of traffic that hits the editor on a tablet or phone. Keep the desktop editor as the authoring surface, add graceful fallbacks.

| # | Item | Acceptance criterion | Primary files |
|---|---|---|---|
| 5.1 | Light/dark toggle on public view | Toggle in sticky header; choice stored in localStorage; default light for new viewers | `PublicResume.tsx` |
| 5.2 | Tablet-responsive editor (768–1279) | Single-column wizard mode; preview reachable via a toggle; no regressions on desktop ≥1280 | `ResumeBuilder.tsx`, `useIsMobile.ts` |
| 5.3 | Mobile read-only view of own resumes | Signed-in phone user sees list of their resumes and can read / share / download — cannot edit | new `src/pages/MyResumes.tsx`, `MobileBlock.tsx` relaxed |

**Exit**: walking commute usecase works — user can share their own resume link from their phone without hitting the current "desktop only" wall.

---

## Sprint 6 — Monetization Plumbing (2 weeks)

**Goal**: Pro tier live. No feature flags hand-waved — real Stripe, real entitlement, real paywall UI.

| # | Item | Acceptance criterion | Primary files |
|---|---|---|---|
| 6.1 | Stripe integration (Checkout + webhook → Supabase) | Purchase flow completes end-to-end in test mode; entitlement lands in `profiles.plan` | new `api/stripe/webhook.ts`, Supabase `plan` column on `profiles` |
| 6.2 | Entitlement hook `usePlan()` + `<Gated>` wrapper | Every premium surface reads through `usePlan()`; contextual upgrade modal on click | new `src/hooks/usePlan.ts`, `src/components/Gated.tsx` |
| 6.3 | Billing settings page | View plan, next renewal, manage portal link, cancel | new `src/pages/Settings.tsx` |
| 6.4 | Paywall the Sprint 4 premium slots | Watermark removal, 3+ templates, 4+ accent colors, 2+ font pairs all gated | templates + accent + watermark renderers |
| 6.5 | Resume limit for free tier | 3 resumes max; 4th triggers upgrade modal | `useResumes.ts`, `SharePanel.tsx` |

**Exit**: a lifetime-deal launch to existing users can go out at the end of this sprint.

---

## Sprint 7 — Analytics MVP (2 weeks)

**Goal**: second-biggest Pro willingness-to-pay anchor. Private dashboard per user.

| # | Item | Acceptance criterion | Primary files |
|---|---|---|---|
| 7.1 | `resume_views` event table (anon, IP-hashed, UA-parsed) | Public view fires a single event per session; no PII stored beyond country + device-class | new `api/track/view.ts`, Supabase `resume_views` table |
| 7.2 | Dashboard page | Views, uniques, 7/30-day sparkline, top referrers, PDF download rate | new `src/pages/Analytics.tsx` |
| 7.3 | Public URL opt-in to `index,follow` (Pro) | Toggle in Share Panel; switches noindex → index + sitemap entry | `PublicResume.tsx`, `api/sitemap.xml.ts` |

**Exit**: owner can see "32 views this week, 4 from LinkedIn, 11 downloaded the PDF".

---

## Sprint 8 — Version History (2 weeks)

**Goal**: Pro users can roll back. Complements undo/redo with durable history.

| # | Item | Acceptance criterion | Primary files |
|---|---|---|---|
| 8.1 | `resume_versions` table + throttled snapshotting (max 1 per 5 min per resume) | History populated without ballooning row count | migration, `useActiveResume.ts` |
| 8.2 | Version list UI with diff chips (fields changed) + restore | "Restore to this version" replaces current `data`; creates a "restored from …" version row | new `src/components/resume/VersionHistory.tsx` |

**Exit**: deliberate bad edit → open history → restore → editor reflects the old state.

---

## Sprint 9 — AI Assist I: Summary & Bullets (2 weeks)

**Goal**: the single highest willingness-to-pay Pro feature. Start small and reliable.

| # | Item | Acceptance criterion | Primary files |
|---|---|---|---|
| 9.1 | Server route for AI calls (Anthropic Claude via Vercel AI Gateway) | Streaming responses; per-user rate limit; error fallback | new `api/ai/generate.ts` |
| 9.2 | Summary generator | "Generate" button in Summary editor produces 3 variants from role + top 3 bullets | `SummaryEditor.tsx` |
| 9.3 | Bullet rewrite (action-verb, quantified, concise) | ⌘-Enter on a bullet triggers inline rewrite; accept/regenerate/reject | `BulletsEditor.tsx` |
| 9.4 | Credit counter for free users (3 free runs; Pro = unlimited) | Quota shown in UI; 4th click prompts upgrade | `usePlan.ts`, `api/ai/generate.ts` |

**Exit**: Pro user can go from blank summary → three polished variants in two clicks.

---

## Sprint 10 — AI Assist II: JD Match & Tone (2 weeks)

**Goal**: differentiator. Paste a job description, get a tailored variant + gap analysis.

| # | Item | Acceptance criterion | Primary files |
|---|---|---|---|
| 10.1 | JD paste + keyword gap panel | Lists missing keywords, suggests where to add, one-click "Tailor this resume" creates a duplicate | new `src/components/resume/JDMatch.tsx`, Supabase `resume_variants` join |
| 10.2 | Tone slider (Plain · Polished · Senior · IC→Manager) | Slider rewrites bullets in-place with preview-first diff | `BulletsEditor.tsx` |
| 10.3 | Grammar / clarity pass across the document | One-click pass; per-sentence suggestions accepted individually | new `src/lib/grammarPass.ts` |

**Exit**: measurable "JD match" score on any resume + a live rewrite flow that works on a real posting.

---

## Sprint 11 — SEO & Landing (2 weeks)

**Goal**: the organic-growth engine. Programmatic landing pages + gallery.

| # | Item | Acceptance criterion | Primary files |
|---|---|---|---|
| 11.1 | `/templates/{role}` landing pages | 8 role slugs pre-seeded; each has 3–5 example resumes and a CTA | new `src/pages/TemplateLanding.tsx`, `src/data/roles.ts` |
| 11.2 | Public gallery (opt-in per resume) | Pro users can flag a resume "featured"; appears on `/gallery` filterable by role | `SharePanel.tsx`, `gallery` column |
| 11.3 | Dynamic sitemap.xml | All indexable public URLs + landing pages listed; revalidated daily | `api/sitemap.xml.ts` |

**Exit**: Google Search Console shows indexed template landing pages within 48 h of launch.

---

## Sprint 12 — Launch & Retention (2 weeks)

**Goal**: a single coordinated push. Product Hunt / Show HN / email drip + social proof.

| # | Item | Acceptance criterion | Primary files |
|---|---|---|---|
| 12.1 | Onboarding email drip (day 0/3/7/14) | Transactional via Resend; per-event opt-out | new `api/emails/*.ts`, Supabase `email_events` |
| 12.2 | "N resumes published this week" counter on marketing | Live from `public_resumes` count; animates in | marketing home |
| 12.3 | Product Hunt / Show HN / Indie Hackers launch assets | Hero video (30s), five screenshots, copy, first 10 upvoter list staged | external only, no code |
| 12.4 | Referral credits (from Sprint 2.4) activated | Referrer gets 1 free Pro month per 3 paid signups referred | `profiles.referrals` table |

**Exit**: launch day traffic peak survives without regressions; dashboard shows net-new Pro signups from referrer attribution.

---

## Cadence summary

| Sprint | Weeks | Theme | User-visible? |
|---|---|---|---|
| 0 | 1 | Prep & tech debt | No |
| 1 | 2 | Trust foundations | Yes |
| 2 | 2 | Shareable virality | Yes |
| 3 | 2 | Editor power & onboarding | Yes |
| 4 | 2 | Template foundation | Yes |
| 5 | 2 | Light/dark + mobile read | Yes |
| 6 | 2 | Monetization plumbing | Yes (Pro goes live) |
| 7 | 2 | Analytics MVP | Yes |
| 8 | 2 | Version history | Yes |
| 9 | 2 | AI Assist I | Yes |
| 10 | 2 | AI Assist II | Yes |
| 11 | 2 | SEO & landing | Partial (SEO-only) |
| 12 | 2 | Launch & retention | Yes |

Total: **25 weeks** (~6 months) from Sprint 0 to full launch with AI and SEO.

---

## Out of scope until proven

- Real-time collaboration (co-authoring) — wait for a signal from the agency tier.
- Teams / agency tier — revisit after Pro crosses ~500 paying users.
- SAML / SSO — enterprise gate; only if agency tier proves out.
- DOCX export — add when a support volume of ATS rejections justifies it.
- Cover letter builder — high effort, unclear LTV lift vs. AI assist on the resume itself.

---

## Critical files (reference)

| Concern | Path |
|---|---|
| Autosave / undo / version history | `src/hooks/useActiveResume.ts` |
| Drag / reorder targets | `src/components/resume/RepeatableSection.tsx`, `BulletsEditor.tsx`, `SkillsEditor.tsx` |
| Share panel + analytics gates | `src/components/resume/SharePanel.tsx`, `src/pages/PublicResume.tsx` |
| Public fetch + OG route | `src/lib/publicResume.ts`, new `api/og/[handle]/[slug].ts` |
| Template + theme split | `src/components/resume/ResumeDocument.tsx` → `templates/*`, `src/lib/resumePrintStyle.ts`, `src/styles/globals.css` |
| Validation UX | `src/lib/validators.ts`, each `*Editor.tsx` |
| Supabase schema (analytics, versions, plans, referrals) | `supabase-setup.sql`, `supabase/migrations/` |
| Paywall & AI routes | new `api/stripe/webhook.ts`, new `api/ai/generate.ts`, new `src/hooks/usePlan.ts`, new `src/components/Gated.tsx` |

## How to track

- One branch per numbered item (e.g. `feat/1.1-drag-reorder`).
- One PR per item. Squash-merge into `main`. No `Co-Authored-By: Claude` trailer.
- A GitHub project board with the table above as a Kanban (column per sprint) keeps this document and reality in sync.

## Verification of this plan

Strategy document, not a PR. Review each sprint's Goal + acceptance criteria; pick the first one or two you want to green-light, and we convert those into implementation plans one at a time through the usual brainstorm → plan → execute flow.
