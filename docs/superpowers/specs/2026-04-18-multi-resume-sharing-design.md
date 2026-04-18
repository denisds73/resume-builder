# Multi-Resume + Public Sharing — Design

**Status:** approved, pending implementation plan
**Date:** 2026-04-18
**Scope:** v1 feature — enable a signed-in user to maintain multiple named resumes under one account, and publish any of them to a stable public URL.

---

## 1. Motivation

Today the app stores a single resume per user. The core use cases this blocks:
- **Tailoring per role** (primary) — a user maintains a "Frontend," "Backend," and "Manager" resume and applies with the right variant.
- **Different personas** — freelance profile vs full-time resume vs speaker bio.
- **General multi-resume** — arbitrary named snapshots the user organises themselves.

Additionally, users want to share a resume as a link — to recruiters, in a job application, on a site — without sending a PDF attachment.

---

## 2. Goals / non-goals

**Goals (v1):**
- A signed-in user can create, name, rename, duplicate, and delete multiple resumes.
- Each resume has a stable public URL: `resumef.vercel.app/@{handle}/{slug}`.
- Per-resume sharing mode: **off / live / snapshot**. Snapshot requires an explicit publish and a visible "unpublished changes" indicator.
- Handles are claimed lazily (first time the user attempts to share, not at signup), preserving the current zero-friction editor entry.
- The migration moves every existing user's single resume into the new schema as their first resume, with no data loss.
- Public URLs are `noindex, nofollow` by default.

**Non-goals (explicitly deferred):**
- View-count analytics on public pages.
- Password-protected or expiring share links.
- Slug history / redirect table on slug changes.
- Soft delete / undo.
- A dashboard view; everything lives in the header switcher for v1.
- Per-resume themes or alternate public layouts.
- Handle renames.
- Public-page SEO / opt-in indexing.
- A hard resume cap per user.
- Multi-user / org accounts.

---

## 3. Architecture

### 3.1 Schema

```sql
-- Many resumes per user
create table public.resumes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  slug            text not null,           -- URL slug, frozen on create
  name            text not null,           -- editable display name
  data            jsonb not null default '{}',
  share_mode      text not null default 'off' check (share_mode in ('off','live','snapshot')),
  published_data  jsonb,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, slug)
);

-- One profile per user, holds handle
create table public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  handle     text unique not null
    check (handle ~ '^[a-z0-9][a-z0-9-]{1,22}[a-z0-9]$'),
  created_at timestamptz not null default now()
);

-- Handles that cannot be claimed
create table public.reserved_handles (handle text primary key);
insert into public.reserved_handles (handle) values
  ('admin'),('api'),('r'),('app'),('settings'),('new'),('profile'),
  ('login'),('signup'),('share'),('help'),('about'),('terms'),('privacy');

-- Public view that enforces snapshot-vs-live selection and hides private rows
create view public.public_resumes
with (security_invoker = off) as
select
  p.handle,
  r.slug,
  r.name,
  case r.share_mode
    when 'live'     then r.data
    when 'snapshot' then r.published_data
  end as data,
  r.share_mode,
  r.published_at,
  r.updated_at
from public.resumes r
join public.profiles p on p.user_id = r.user_id
where r.share_mode in ('live','snapshot');
```

### 3.2 RLS

- `resumes`: owner full CRUD. Anon role has **no direct access** — all public reads go through `public_resumes`.
- `profiles`: owner read/write own; anon read (needed for handle-based lookup and public view joins).
- `reserved_handles`: anon read (so the client can warn early); no write.

### 3.3 Routes

| Path | Purpose |
|---|---|
| `/` | Editor, scoped to active resume (most-recently-edited). Header switcher changes active in-place. |
| `/@:handle/:slug` | Public view. Thin wrapper around `ResumePreview` with brand top bar, Download PDF, noindex meta. |
| `/auth/callback` | Existing Supabase callback, unchanged. |

The slug does not appear in the editor URL. This preserves the current "editor as single workspace" feel and avoids URL churn when switching resumes.

---

## 4. UX flows

### 4.1 First-time user
Lands on `/`, edits immediately. Local draft only. No prompts. (Unchanged from today.)

### 4.2 Sign-in (including existing-user migration)
User clicks "Save to cloud" → magic link → returns signed-in. Local draft upserts as their first resume: `name: "My resume"`, `slug: resume`. Header switcher appears with one row.

### 4.3 New resume (blank)
Switcher → **+ New resume** → slide-over with *name* (required) and *slug* (auto-derived, editable once, locked after create, live uniqueness check). Create → switches active resume to the new one.

### 4.4 Duplicate (primary tailoring flow)
Switcher row → kebab → **Duplicate**. Same slide-over pre-filled as `"Frontend (copy)"` / `frontend-copy`. User tweaks, creates, switches.

### 4.5 First share (lazy handle claim)
User clicks **Share** in the editor header. If no handle yet:

> "Pick a handle — this is the `@` part of your public resume URL. You can't change it later."
> `resumef.vercel.app/@` `[___________]` — inline availability + validation.

After claim (or if handle already exists), modal transitions to the **share panel**:

- Mode: radio row **Off / Live / Snapshot**.
- URL display + copy button: `resumef.vercel.app/@denis/frontend`.
- In **Snapshot** mode: **Publish** button (first time) / **Update** (subsequent). An "Unpublished changes" chip appears when the client-side `JSON.stringify(data) !== JSON.stringify(published_data)` (shallow stringify comparison is sufficient; no field-level diff).
- **Stop sharing** button sets `share_mode = off`.

### 4.6 Delete
Switcher row → kebab → **Delete**. Confirm dialog: *"Delete 'Frontend'? This can't be undone."* Hard delete. If shared, public URL 404s. If it was active, switch to the next most-recently-edited. If it was the user's **only** resume, auto-create a blank `("My resume", "resume")` and make it active, so the editor never enters a zero-resume state.

### 4.7 UX invariants
- **Share button** is always visible in the editor header next to Download PDF. When `share_mode = off`: reads "Share". Otherwise shows a state chip (`● Live` or `◐ Snapshot`).
- **Switcher** shows active resume name; clicking opens a dropdown with rows of `{name, share-mode dot, last-edited relative time}`.
- **Save status chip** continues to reflect the active resume, same as today.

---

## 5. Components (new / modified)

| Component | Kind | Purpose |
|---|---|---|
| `components/ResumeSwitcher.tsx` | new | Header dropdown, list + + New + Duplicate + Delete |
| `components/SharePanel.tsx` | new | Share modal with mode toggle, URL display, publish/update, stop |
| `components/HandleClaimDialog.tsx` | new | One-time handle claim, shown inside SharePanel before it activates |
| `components/NewResumeDialog.tsx` | new | Shared slide-over for New + Duplicate flows |
| `pages/PublicResume.tsx` | new | Mounted at `/@:handle/:slug`, thin wrapper around `ResumePreview` |
| `hooks/useResumes.ts` | new | List-of-resumes hook (list, create, duplicate, rename, delete) |
| `hooks/useActiveResume.ts` | new (replaces `useResume`) | Single-resume read/save, keyed by `resume_id` |
| `hooks/useProfile.ts` | new | Load + claim handle |
| `lib/slug.ts` | new | Slugify, validate, check availability |
| `lib/supabase.ts` | mod | Add typed queries for new tables |
| `pages/ResumeBuilder.tsx` | mod | Integrate switcher + share button, track active resume |
| `App.tsx` | mod | Add `/@:handle/:slug` route |
| `supabase-setup.sql` | mod | Replace current schema; include migration statements |

---

## 6. Data flow

**Editor (signed-in, active resume):**
`useActiveResume(id)` → reads `resumes` row → writes on debounced save → writes touch `updated_at`. If `share_mode='live'`, the public view reflects changes on the next fetch. If `share_mode='snapshot'`, public view continues to show `published_data` until user clicks Publish/Update.

**Publish / Update (snapshot mode):**
Client calls an RPC `publish_resume(resume_id)` that copies `data → published_data`, sets `published_at = now()`. Atomic, simple; RLS ensures only owner can invoke.

**Public view:**
`pages/PublicResume.tsx` does a single `select` from `public_resumes` by `(handle, slug)`. No auth required. Missing → 404.

**Handle claim:**
Client calls an RPC `claim_handle(h)` that validates against regex + reserved list and inserts into `profiles`. Returns error on conflict.

---

## 7. Migration

One-shot, pre-launch. Run in Supabase SQL editor:

```sql
begin;
alter table public.resumes rename to resumes_legacy;

-- Create new profiles, resumes, reserved_handles, public_resumes view per section 3.1
-- ...

insert into public.resumes (user_id, slug, name, data, created_at, updated_at)
select user_id, 'resume', 'My resume', data, updated_at, updated_at
from public.resumes_legacy;

-- Verify row counts match before dropping
-- drop table public.resumes_legacy;

commit;
```

Unsigned-in users keep their localStorage draft. First sign-in post-migration upserts the draft as `("My resume", "resume")` — the same path as a new user.

---

## 8. Risks & mitigations

| Risk | Mitigation |
|---|---|
| RLS misconfiguration exposes private resume data on public endpoints | Public reads go through `public_resumes` view only; anon role has zero direct access to `resumes`. Verification test below. |
| Handle squatting / abuse | Regex + length limits + reserved list + unique constraint. Rate-limit the `claim_handle` RPC only if abuse appears. |
| Snapshot drift confusion ("recruiter sees old version") | "Unpublished changes" chip + explicit Publish/Update button. |
| Slug collisions across users | Not a concern — slugs are unique per user, not globally. Different users can each have `/frontend`. |
| User accidentally deletes the wrong resume | Hard-delete confirm dialog. Future: undo toast if this becomes an issue. |

---

## 9. Verification plan

"Done" means all of the following hold:

1. Create / rename / duplicate / delete flows all work via the switcher; one resume is always active.
2. Active resume auto-saves with the existing debounce; status chip updates per-resume.
3. `Off → Live`: current state is reachable at `/@handle/slug` and reflects edits.
4. `Off → Snapshot` → **Publish** → edits no longer reflected publicly until **Update**. "Unpublished changes" chip appears on edit, clears on update.
5. `curl https://resumef.vercel.app/rest/v1/resumes?select=*` (anon key) returns `[]`. Only `public_resumes` is reachable.
6. Handle claim rejects: taken handles, reserved handles, strings failing the regex. Succeeds once on a valid handle; subsequent attempts by same user fail (already claimed).
7. Deleting a shared resume: public URL 404s immediately.
8. Any pre-existing rows in the legacy `resumes` table land post-migration as one row each, named "My resume" at slug `resume`, data intact. Row count in the new table matches the legacy row count.

---

## 10. Deployment notes

- Feature runs on the free `resumef.vercel.app` domain. No custom domain dependency.
- Supabase redirect-URL allow-list must include `https://resumef.vercel.app` and `http://localhost:5173`.
- Vercel project env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are required; already documented in `.env.example`.
- Migration SQL runs once in the Supabase SQL editor, not via app deploy. Order: migrate DB → deploy new app build. The new build expects the new schema.
