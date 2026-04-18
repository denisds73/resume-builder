# Multi-Resume + Public Sharing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a signed-in user maintain multiple named resumes under one account and publish any of them to a stable public URL (`/@{handle}/{slug}`) in either live or snapshot mode.

**Architecture:** Supabase schema changes from single-row-per-user to a `resumes` table keyed by uuid with a per-user unique `slug`, plus a `profiles` table holding the user's handle and a `public_resumes` view enforcing RLS for anon reads. Editor stays at `/` with a header switcher for active resume; a new `/@:handle/:slug` route renders a thin wrapper around the existing preview for public consumption. Two Postgres RPCs (`claim_handle`, `publish_resume`) gate the write paths that need validation or atomicity.

**Tech Stack:** React 19 + TypeScript, Supabase (Postgres + RLS + RPCs + magic-link auth), React Router 7, Framer Motion, Tailwind v4.

**Branch strategy:** all work lands on one feature branch `feat/multi-resume-sharing`, PR opened at the end. No intermediate merges to `main` — the migration is a breaking schema change and `main` must not enter a half-migrated state.

**Commits:** no `Co-Authored-By: Claude` trailer (per user preference).

---

## Reference — the spec

Spec lives at `docs/superpowers/specs/2026-04-18-multi-resume-sharing-design.md`. Keep it open during implementation.

---

## File Structure

### New files
| Path | Responsibility |
|---|---|
| `supabase/migrations/001-multi-resume.sql` | One-shot migration: drops-and-recreates schema, preserves legacy rows, creates `profiles`, `reserved_handles`, new `resumes`, `public_resumes` view, RLS policies, RPCs. |
| `src/lib/slug.ts` | Pure utilities: `slugify(s)`, `isValidSlug(s)`, `isValidHandle(h)`, reserved list constant. |
| `src/lib/publicResume.ts` | Anon-key fetch of `public_resumes` by `(handle, slug)`. |
| `src/hooks/useProfile.ts` | Load current user's handle; `claimHandle(h)` calls the RPC. |
| `src/hooks/useResumes.ts` | Lists resumes for user; exposes `create`, `duplicate`, `rename`, `delete`, and an `active` derivation. |
| `src/hooks/useActiveResume.ts` | Replaces `useResume`: single resume CRUD keyed by `resume_id`; debounced save; publish/unpublish helpers. |
| `src/components/resume/ResumeSwitcher.tsx` | Header dropdown: list, active indicator, kebab menu per row (rename, duplicate, delete), "+ New resume" button. |
| `src/components/resume/NewResumeDialog.tsx` | Slide-over used by both "+ New" and "Duplicate". Name + slug fields, live uniqueness check. |
| `src/components/resume/HandleClaimDialog.tsx` | Standalone handle-claim view; owns input, validation, availability. |
| `src/components/resume/SharePanel.tsx` | Share modal: Off/Live/Snapshot radios, URL display, Publish/Update, Stop sharing, unpublished-changes chip. Embeds `HandleClaimDialog` when no handle yet. |
| `src/components/resume/ShareButton.tsx` | Header button + state chip. Opens `SharePanel`. |
| `src/pages/PublicResume.tsx` | Mounted at `/@:handle/:slug`. Thin wrapper around `ResumePreview` with brand top bar, Download PDF, `<noindex>` meta. 404 on missing. |

### Modified files
| Path | Change |
|---|---|
| `supabase-setup.sql` | Replace with the new schema (greenfield installs run this; existing installs run the migration instead). |
| `src/lib/supabase.ts` | Add `ResumeRow`, `ProfileRow`, `PublicResumeRow` types; update getters. Remove old single-row `ResumeRow` shape. |
| `src/hooks/useResume.ts` | **Delete.** `useActiveResume` replaces it. |
| `src/pages/ResumeBuilder.tsx` | Use `useResumes` + `useActiveResume`; render `ResumeSwitcher` in header; render `ShareButton`; thread active resume id through. |
| `src/App.tsx` | Add `<Route path="/@:handle/:slug" element={<PublicResume/>}>` before the catch-all. |
| `.remember/` | Untracked session state — ignore. |

---

## Verification strategy

Every step ends with a verification command (type-check, build, or manual browser check). Because the project has no test framework, "passing" = no TS errors, no ESLint errors, and — for UI tasks — a manual browser smoke using Chrome DevTools.

Commands used throughout:
- Type-check: `npx tsc -p tsconfig.app.json --noEmit`
- Lint: `npm run lint`
- Build: `npm run build`
- Dev server: `npm run dev` (visit `http://localhost:5173`)

---

## Task 0: Branch & Supabase prep

**Files:**
- Create branch locally
- Manual Supabase dashboard actions

- [ ] **Step 1: Sync main and create the feature branch**

```bash
git checkout main
git pull
git checkout -b feat/multi-resume-sharing
```

- [ ] **Step 2: Confirm Supabase env vars are set locally**

Check `.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. If not, create `.env` by copying `.env.example` and filling in values from the Supabase project Settings → API page.

Verify:
```bash
grep -E "VITE_SUPABASE_(URL|ANON_KEY)" .env
```
Expected: two lines, both populated (not placeholder `xxx` values).

- [ ] **Step 3: Confirm the Supabase project redirect URL allow-list**

In the Supabase dashboard → **Authentication → URL Configuration**, confirm both are present:
- `http://localhost:5173/**`
- `https://resumef.vercel.app/**`

Add them if missing.

- [ ] **Step 4: Commit nothing yet — no file changes**

This is a prep task. Proceed to Task 1.

---

## Task 1: Migration SQL

**Files:**
- Create: `supabase/migrations/001-multi-resume.sql`
- Modify: `supabase-setup.sql` (replace with new greenfield schema)

- [ ] **Step 1: Create migration directory and file**

```bash
mkdir -p supabase/migrations
```

Create `supabase/migrations/001-multi-resume.sql`:

```sql
-- Migrate from single-row-per-user resumes to multi-resume + profiles schema.
-- Idempotent where practical; safe to re-run after the first successful apply
-- only if resumes_legacy was dropped (otherwise rename will fail — that's fine,
-- it means the migration already ran).

begin;

-- ── 1. Rename the legacy table so the new one can take its place ─────────
alter table if exists public.resumes rename to resumes_legacy;

-- ── 2. Profiles (one per user, holds handle) ─────────────────────────────
create table if not exists public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  handle     text unique not null
    check (handle ~ '^[a-z0-9][a-z0-9-]{1,22}[a-z0-9]$'),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = user_id);

drop policy if exists profiles_select_public on public.profiles;
create policy profiles_select_public on public.profiles
  for select to anon using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = user_id);

-- No update/delete policies — handles are immutable per the spec.

-- ── 3. Reserved handles ──────────────────────────────────────────────────
create table if not exists public.reserved_handles (handle text primary key);

insert into public.reserved_handles (handle) values
  ('admin'),('api'),('r'),('app'),('settings'),('new'),('profile'),
  ('login'),('signup'),('share'),('help'),('about'),('terms'),('privacy')
on conflict do nothing;

alter table public.reserved_handles enable row level security;

drop policy if exists reserved_handles_select_all on public.reserved_handles;
create policy reserved_handles_select_all on public.reserved_handles
  for select using (true);

-- ── 4. Resumes (many per user) ───────────────────────────────────────────
create table if not exists public.resumes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  slug            text not null,
  name            text not null,
  data            jsonb not null default '{}'::jsonb,
  share_mode      text not null default 'off'
                  check (share_mode in ('off','live','snapshot')),
  published_data  jsonb,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, slug)
);

create index if not exists resumes_user_updated_at_idx
  on public.resumes (user_id, updated_at desc);

alter table public.resumes enable row level security;

drop policy if exists resumes_select_own on public.resumes;
create policy resumes_select_own on public.resumes
  for select using (auth.uid() = user_id);

drop policy if exists resumes_insert_own on public.resumes;
create policy resumes_insert_own on public.resumes
  for insert with check (auth.uid() = user_id);

drop policy if exists resumes_update_own on public.resumes;
create policy resumes_update_own on public.resumes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists resumes_delete_own on public.resumes;
create policy resumes_delete_own on public.resumes
  for delete using (auth.uid() = user_id);

-- No public select policy — anon reads go through public_resumes view only.

-- ── 5. Public resumes view ───────────────────────────────────────────────
drop view if exists public.public_resumes;
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

grant select on public.public_resumes to anon, authenticated;

-- ── 6. RPCs ──────────────────────────────────────────────────────────────
create or replace function public.claim_handle(new_handle text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  existing public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if new_handle is null
     or new_handle !~ '^[a-z0-9][a-z0-9-]{1,22}[a-z0-9]$' then
    raise exception 'invalid handle';
  end if;

  if exists (select 1 from public.reserved_handles where handle = new_handle) then
    raise exception 'handle reserved';
  end if;

  select * into existing from public.profiles where user_id = auth.uid();
  if found then
    raise exception 'handle already claimed';
  end if;

  insert into public.profiles (user_id, handle) values (auth.uid(), new_handle);
end;
$$;

revoke all on function public.claim_handle(text) from public;
grant execute on function public.claim_handle(text) to authenticated;

create or replace function public.publish_resume(resume_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  update public.resumes
     set published_data = data,
         published_at = now(),
         updated_at = now()
   where id = resume_id
     and user_id = auth.uid()
     and share_mode = 'snapshot';

  if not found then
    raise exception 'resume not found, not owned, or not in snapshot mode';
  end if;
end;
$$;

revoke all on function public.publish_resume(uuid) from public;
grant execute on function public.publish_resume(uuid) to authenticated;

-- ── 7. Backfill from legacy table ────────────────────────────────────────
insert into public.resumes (user_id, slug, name, data, created_at, updated_at)
select user_id, 'resume', 'My resume', data, updated_at, updated_at
from public.resumes_legacy
on conflict (user_id, slug) do nothing;

-- Intentionally NOT dropping resumes_legacy here. Drop it manually after
-- verifying row counts match:
--   select count(*) from resumes_legacy;
--   select count(*) from resumes;
-- Then: drop table public.resumes_legacy;

commit;
```

- [ ] **Step 2: Replace `supabase-setup.sql` for greenfield installs**

Open `supabase-setup.sql` and replace the entire contents with the non-migration equivalent (skip the `rename` and `backfill` steps from the migration). Keep the comment at the top pointing new contributors to run this file, and existing deployments to run `supabase/migrations/001-multi-resume.sql`.

Final `supabase-setup.sql`:

```sql
-- Resumefolio — Supabase greenfield schema.
-- For a brand-new Supabase project. Existing deployments should instead
-- run supabase/migrations/001-multi-resume.sql which preserves legacy data.

begin;

create table if not exists public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  handle     text unique not null
    check (handle ~ '^[a-z0-9][a-z0-9-]{1,22}[a-z0-9]$'),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = user_id);

drop policy if exists profiles_select_public on public.profiles;
create policy profiles_select_public on public.profiles
  for select to anon using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = user_id);

create table if not exists public.reserved_handles (handle text primary key);

insert into public.reserved_handles (handle) values
  ('admin'),('api'),('r'),('app'),('settings'),('new'),('profile'),
  ('login'),('signup'),('share'),('help'),('about'),('terms'),('privacy')
on conflict do nothing;

alter table public.reserved_handles enable row level security;

drop policy if exists reserved_handles_select_all on public.reserved_handles;
create policy reserved_handles_select_all on public.reserved_handles
  for select using (true);

create table if not exists public.resumes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  slug            text not null,
  name            text not null,
  data            jsonb not null default '{}'::jsonb,
  share_mode      text not null default 'off'
                  check (share_mode in ('off','live','snapshot')),
  published_data  jsonb,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, slug)
);

create index if not exists resumes_user_updated_at_idx
  on public.resumes (user_id, updated_at desc);

alter table public.resumes enable row level security;

drop policy if exists resumes_select_own on public.resumes;
create policy resumes_select_own on public.resumes
  for select using (auth.uid() = user_id);

drop policy if exists resumes_insert_own on public.resumes;
create policy resumes_insert_own on public.resumes
  for insert with check (auth.uid() = user_id);

drop policy if exists resumes_update_own on public.resumes;
create policy resumes_update_own on public.resumes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists resumes_delete_own on public.resumes;
create policy resumes_delete_own on public.resumes
  for delete using (auth.uid() = user_id);

drop view if exists public.public_resumes;
create view public.public_resumes
with (security_invoker = off) as
select p.handle, r.slug, r.name,
  case r.share_mode when 'live' then r.data when 'snapshot' then r.published_data end as data,
  r.share_mode, r.published_at, r.updated_at
from public.resumes r
join public.profiles p on p.user_id = r.user_id
where r.share_mode in ('live','snapshot');

grant select on public.public_resumes to anon, authenticated;

create or replace function public.claim_handle(new_handle text)
returns void language plpgsql security definer set search_path = public as $$
declare existing public.profiles%rowtype;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if new_handle is null or new_handle !~ '^[a-z0-9][a-z0-9-]{1,22}[a-z0-9]$' then
    raise exception 'invalid handle';
  end if;
  if exists (select 1 from public.reserved_handles where handle = new_handle) then
    raise exception 'handle reserved';
  end if;
  select * into existing from public.profiles where user_id = auth.uid();
  if found then raise exception 'handle already claimed'; end if;
  insert into public.profiles (user_id, handle) values (auth.uid(), new_handle);
end; $$;

revoke all on function public.claim_handle(text) from public;
grant execute on function public.claim_handle(text) to authenticated;

create or replace function public.publish_resume(resume_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  update public.resumes
     set published_data = data, published_at = now(), updated_at = now()
   where id = resume_id and user_id = auth.uid() and share_mode = 'snapshot';
  if not found then raise exception 'resume not found, not owned, or not in snapshot mode'; end if;
end; $$;

revoke all on function public.publish_resume(uuid) from public;
grant execute on function public.publish_resume(uuid) to authenticated;

commit;
```

- [ ] **Step 3: Apply the migration in the Supabase SQL editor**

Open Supabase dashboard → SQL Editor → paste the contents of `supabase/migrations/001-multi-resume.sql` → Run.

Verify in Table Editor:
- `profiles` exists (empty)
- `reserved_handles` exists with ~14 rows
- `resumes` exists; any pre-existing legacy rows appear with slug `resume`, name `My resume`
- `resumes_legacy` still exists (kept intentionally)

Run a manual smoke check in SQL Editor:
```sql
select count(*) from resumes;
select count(*) from resumes_legacy;
```
Both counts should match if you had any existing users.

- [ ] **Step 4: Verify RLS blocks anon direct read of `resumes`**

In the SQL editor, open a new query and run:
```sql
-- Impersonate the anon role
set local role anon;
select * from public.resumes;
```
Expected: zero rows (RLS blocks).

```sql
select * from public.public_resumes;
```
Expected: also zero rows now (no one has set `share_mode != 'off'` yet). Reset role:
```sql
reset role;
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/001-multi-resume.sql supabase-setup.sql
git commit -m "feat(schema): add multi-resume schema with profiles, RLS, and RPCs

Introduces the data layer for multi-resume + public sharing:
- resumes table keyed by uuid with (user_id, slug) uniqueness
- profiles table for per-user handles with immutable constraint
- reserved_handles blocklist
- public_resumes view enforcing live/snapshot data selection for anon
- claim_handle and publish_resume RPCs gating validated writes
- Backfills legacy single-row resumes as slug=resume, name='My resume'"
```

---

## Task 2: Slug + handle utilities

**Files:**
- Create: `src/lib/slug.ts`

- [ ] **Step 1: Create `src/lib/slug.ts`**

```ts
export const RESERVED_HANDLES = new Set([
  'admin', 'api', 'r', 'app', 'settings', 'new', 'profile',
  'login', 'signup', 'share', 'help', 'about', 'terms', 'privacy',
])

const HANDLE_RE = /^[a-z0-9][a-z0-9-]{1,22}[a-z0-9]$/
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$/

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug)
}

export interface HandleError {
  ok: false
  reason: 'too-short' | 'too-long' | 'invalid-chars' | 'reserved'
}
export interface HandleOk { ok: true }
export type HandleValidation = HandleOk | HandleError

export function validateHandle(handle: string): HandleValidation {
  if (handle.length < 3) return { ok: false, reason: 'too-short' }
  if (handle.length > 24) return { ok: false, reason: 'too-long' }
  if (!HANDLE_RE.test(handle)) return { ok: false, reason: 'invalid-chars' }
  if (RESERVED_HANDLES.has(handle)) return { ok: false, reason: 'reserved' }
  return { ok: true }
}

export function handleErrorMessage(reason: HandleError['reason']): string {
  switch (reason) {
    case 'too-short':    return 'Handle must be at least 3 characters.'
    case 'too-long':     return 'Handle must be 24 characters or fewer.'
    case 'invalid-chars':return 'Only lowercase letters, numbers, and hyphens. No leading/trailing hyphens.'
    case 'reserved':     return 'That handle is reserved. Try another.'
  }
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc -p tsconfig.app.json --noEmit
```
Expected: no output.

- [ ] **Step 3: Lint**

```bash
npm run lint
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/slug.ts
git commit -m "feat(lib): add slug and handle validation utilities

Pure helpers for slugify, slug/handle validation, reserved-handle check,
and user-facing error copy. Keeps the same regex as the Postgres check
constraints so client-side rejects mirror server-side rejects."
```

---

## Task 3: Supabase row types

**Files:**
- Modify: `src/lib/supabase.ts`

- [ ] **Step 1: Update `src/lib/supabase.ts`**

Open the file and replace the exports. Final contents:

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { ResumeData } from '@/types/resume'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

export type ShareMode = 'off' | 'live' | 'snapshot'

export interface ResumeRow {
  id: string
  user_id: string
  slug: string
  name: string
  data: ResumeData
  share_mode: ShareMode
  published_data: ResumeData | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface ProfileRow {
  user_id: string
  handle: string
  created_at: string
}

export interface PublicResumeRow {
  handle: string
  slug: string
  name: string
  data: ResumeData
  share_mode: Exclude<ShareMode, 'off'>
  published_at: string | null
  updated_at: string
}

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!client) {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase is not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      )
    }
    client = createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  }
  return client
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc -p tsconfig.app.json --noEmit
```
Expected: errors in `src/hooks/useResume.ts` because old `ResumeRow` fields are gone. This is expected — Task 5/6 will delete that file. Record the errors as: "expected breakage of useResume.ts; to be removed in Task 6." If any OTHER file errors, investigate.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase.ts
git commit -m "feat(lib): update Supabase row types for multi-resume schema

ResumeRow gains id + slug + name + share_mode + published_*.
Adds ProfileRow and PublicResumeRow for the new tables / view."
```

---

## Task 4: `useProfile` hook

**Files:**
- Create: `src/hooks/useProfile.ts`

- [ ] **Step 1: Create `src/hooks/useProfile.ts`**

```ts
import { useCallback, useEffect, useState } from 'react'
import { getSupabase, isSupabaseConfigured, type ProfileRow } from '@/lib/supabase'
import { useAuth } from './useAuth'

type Status = 'idle' | 'loading' | 'ready' | 'error'

export interface UseProfileReturn {
  handle: string | null
  status: Status
  claim: (handle: string) => Promise<void>
  reload: () => Promise<void>
}

export function useProfile(): UseProfileReturn {
  const { user } = useAuth()
  const [handle, setHandle] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !user) {
      setHandle(null)
      setStatus('idle')
      return
    }
    setStatus('loading')
    const { data, error } = await getSupabase()
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle<ProfileRow>()
    if (error) {
      setStatus('error')
      return
    }
    setHandle(data?.handle ?? null)
    setStatus('ready')
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  const claim = useCallback(
    async (newHandle: string) => {
      if (!isSupabaseConfigured || !user) throw new Error('Not signed in.')
      const { error } = await getSupabase().rpc('claim_handle', { new_handle: newHandle })
      if (error) throw new Error(error.message || 'Handle claim failed.')
      setHandle(newHandle)
    },
    [user],
  )

  return { handle, status, claim, reload: load }
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc -p tsconfig.app.json --noEmit
```
Expected: still only the pre-existing `useResume.ts` errors from Task 3.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useProfile.ts
git commit -m "feat(hooks): add useProfile for handle load + claim

Loads the signed-in user's handle on mount, exposes a claim() that
calls the claim_handle RPC. Bubbles server error messages to the
caller so the dialog can show 'handle reserved', 'already taken', etc."
```

---

## Task 5: `useResumes` hook (list + CRUD)

**Files:**
- Create: `src/hooks/useResumes.ts`

- [ ] **Step 1: Create `src/hooks/useResumes.ts`**

```ts
import { useCallback, useEffect, useState } from 'react'
import { getSupabase, isSupabaseConfigured, type ResumeRow } from '@/lib/supabase'
import { emptyResume, type ResumeData } from '@/types/resume'
import { useAuth } from './useAuth'

type Status = 'idle' | 'loading' | 'ready' | 'error'

export interface UseResumesReturn {
  resumes: ResumeRow[]
  status: Status
  activeId: string | null
  setActiveId: (id: string) => void
  create: (input: { name: string; slug: string; data?: ResumeData }) => Promise<ResumeRow>
  duplicate: (sourceId: string, name: string, slug: string) => Promise<ResumeRow>
  rename: (id: string, name: string) => Promise<void>
  remove: (id: string) => Promise<void>
  reload: () => Promise<void>
}

const LOCAL_ACTIVE_KEY = 'resumefolio:active-resume-id'

export function useResumes(): UseResumesReturn {
  const { user } = useAuth()
  const [resumes, setResumes] = useState<ResumeRow[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [activeId, setActiveIdState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(LOCAL_ACTIVE_KEY)
  })

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !user) {
      setResumes([])
      setStatus('idle')
      return
    }
    setStatus('loading')
    const { data, error } = await getSupabase()
      .from('resumes')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
    if (error) {
      setStatus('error')
      return
    }
    let rows = (data ?? []) as ResumeRow[]

    // First sign-in from anon: if no rows exist, upsert the localStorage
    // draft as their first resume (spec §4.2). Zero-row state should never
    // be visible to the user past this point.
    if (rows.length === 0) {
      const raw = window.localStorage.getItem('resume:draft')
      const draftData = raw ? JSON.parse(raw) : {}
      const { data: first, error: createErr } = await getSupabase()
        .from('resumes')
        .insert({
          user_id: user.id,
          slug: 'resume',
          name: 'My resume',
          data: draftData,
        })
        .select('*')
        .single<ResumeRow>()
      if (createErr) {
        setStatus('error')
        return
      }
      rows = [first]
    }

    setResumes(rows)
    setStatus('ready')
    const currentIsValid = activeId && rows.some((r) => r.id === activeId)
    if (!currentIsValid) {
      setActiveIdState(rows[0].id)
      window.localStorage.setItem(LOCAL_ACTIVE_KEY, rows[0].id)
    }
  }, [user, activeId])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const setActiveId = useCallback((id: string) => {
    setActiveIdState(id)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOCAL_ACTIVE_KEY, id)
    }
  }, [])

  const create = useCallback<UseResumesReturn['create']>(
    async ({ name, slug, data }) => {
      if (!user) throw new Error('Not signed in.')
      const payload = {
        user_id: user.id,
        name,
        slug,
        data: data ?? emptyResume(),
      }
      const { data: row, error } = await getSupabase()
        .from('resumes')
        .insert(payload)
        .select('*')
        .single<ResumeRow>()
      if (error) throw new Error(error.message)
      setResumes((prev) => [row, ...prev])
      setActiveId(row.id)
      return row
    },
    [user, setActiveId],
  )

  const duplicate = useCallback<UseResumesReturn['duplicate']>(
    async (sourceId, name, slug) => {
      const source = resumes.find((r) => r.id === sourceId)
      if (!source) throw new Error('Source resume not found.')
      return await create({ name, slug, data: source.data })
    },
    [resumes, create],
  )

  const rename = useCallback<UseResumesReturn['rename']>(
    async (id, name) => {
      const { error } = await getSupabase()
        .from('resumes')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw new Error(error.message)
      setResumes((prev) => prev.map((r) => (r.id === id ? { ...r, name } : r)))
    },
    [],
  )

  const remove = useCallback<UseResumesReturn['remove']>(
    async (id) => {
      const { error } = await getSupabase().from('resumes').delete().eq('id', id)
      if (error) throw new Error(error.message)
      setResumes((prev) => {
        const next = prev.filter((r) => r.id !== id)
        if (activeId === id) {
          const fallback = next[0]?.id ?? null
          setActiveIdState(fallback)
          if (fallback && typeof window !== 'undefined') {
            window.localStorage.setItem(LOCAL_ACTIVE_KEY, fallback)
          }
        }
        return next
      })
      // If the user deleted their last resume, auto-create a blank one.
      // Do this outside setResumes so it sees committed state.
      if (!resumes.some((r) => r.id !== id)) {
        await create({ name: 'My resume', slug: 'resume' })
      }
    },
    [activeId, resumes, create],
  )

  return {
    resumes,
    status,
    activeId,
    setActiveId,
    create,
    duplicate,
    rename,
    remove,
    reload: load,
  }
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc -p tsconfig.app.json --noEmit
```
Expected: still only `useResume.ts` errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useResumes.ts
git commit -m "feat(hooks): add useResumes for list + create/duplicate/rename/delete

Manages the signed-in user's resume list, persists the active
resume id to localStorage so a reload lands on the same one, and
auto-creates a 'My resume' fallback when the last resume is deleted
to avoid a zero-resume state."
```

---

## Task 6: `useActiveResume` hook + remove `useResume` + integrate

**Files:**
- Create: `src/hooks/useActiveResume.ts`
- Delete: `src/hooks/useResume.ts`
- Modify: `src/pages/ResumeBuilder.tsx`

This is the riskiest task: we swap the entire data hook and adapt the page. Do it in one atomic commit so the app stays buildable.

- [ ] **Step 1: Create `src/hooks/useActiveResume.ts`**

```ts
import { useCallback, useEffect, useRef, useState } from 'react'
import { getSupabase, isSupabaseConfigured, type ResumeRow, type ShareMode } from '@/lib/supabase'
import { emptyResume, type ResumeData } from '@/types/resume'
import { useAuth } from './useAuth'

const LOCAL_DRAFT_KEY = 'resume:draft'  // preserved from old useResume
const DEBOUNCE_MS = 800

type Status = 'idle' | 'loading' | 'saving' | 'saved' | 'error'

export interface UseActiveResumeReturn {
  data: ResumeData
  setData: (updater: ResumeData | ((prev: ResumeData) => ResumeData)) => void
  status: Status
  lastSavedAt: Date | null
  shareMode: ShareMode
  setShareMode: (mode: ShareMode) => Promise<void>
  publishedData: ResumeData | null
  publishedAt: Date | null
  publish: () => Promise<void>
  signedIn: boolean
  slug: string | null
  name: string
}

function readLocalDraft(): ResumeData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(LOCAL_DRAFT_KEY)
    if (!raw) return null
    return { ...emptyResume(), ...(JSON.parse(raw) as ResumeData) }
  } catch {
    return null
  }
}

function writeLocalDraft(data: ResumeData) {
  try {
    window.localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(data))
  } catch {
    // quota — ignore
  }
}

/**
 * Read/write a single resume by id. If resumeId is null the hook falls back
 * to the pre-signin localStorage draft so the editor still works for
 * anonymous users.
 */
export function useActiveResume(resumeId: string | null): UseActiveResumeReturn {
  const { user } = useAuth()
  const [row, setRow] = useState<ResumeRow | null>(null)
  const [data, setDataState] = useState<ResumeData>(() => readLocalDraft() ?? emptyResume())
  const [status, setStatus] = useState<Status>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load when resumeId changes
  useEffect(() => {
    let active = true
    if (!resumeId || !user || !isSupabaseConfigured) {
      setRow(null)
      // Keep local draft if we're in anon mode
      if (!user) setDataState(readLocalDraft() ?? emptyResume())
      setStatus('idle')
      return
    }
    setStatus('loading')
    getSupabase()
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .maybeSingle<ResumeRow>()
      .then(({ data: loaded, error }) => {
        if (!active) return
        if (error || !loaded) {
          setStatus('error')
          return
        }
        setRow(loaded)
        setDataState({ ...emptyResume(), ...loaded.data })
        setLastSavedAt(loaded.updated_at ? new Date(loaded.updated_at) : null)
        setStatus('saved')
      })
    return () => {
      active = false
    }
  }, [resumeId, user])

  const persist = useCallback(
    async (next: ResumeData) => {
      if (!resumeId || !user) return
      setStatus('saving')
      const now = new Date().toISOString()
      const { error } = await getSupabase()
        .from('resumes')
        .update({ data: next, updated_at: now })
        .eq('id', resumeId)
      if (error) {
        setStatus('error')
        return
      }
      setLastSavedAt(new Date(now))
      setStatus('saved')
    },
    [resumeId, user],
  )

  const setData = useCallback<UseActiveResumeReturn['setData']>(
    (updater) => {
      setDataState((prev) => {
        const next =
          typeof updater === 'function'
            ? (updater as (p: ResumeData) => ResumeData)(prev)
            : updater
        writeLocalDraft(next)
        if (!user || !resumeId) return next
        if (saveTimer.current) clearTimeout(saveTimer.current)
        setStatus('saving')
        saveTimer.current = setTimeout(() => persist(next), DEBOUNCE_MS)
        return next
      })
    },
    [persist, user, resumeId],
  )

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
  }, [])

  const setShareMode = useCallback<UseActiveResumeReturn['setShareMode']>(
    async (mode) => {
      if (!resumeId) return
      const { error } = await getSupabase()
        .from('resumes')
        .update({ share_mode: mode, updated_at: new Date().toISOString() })
        .eq('id', resumeId)
      if (error) throw new Error(error.message)
      setRow((r) => (r ? { ...r, share_mode: mode } : r))
    },
    [resumeId],
  )

  const publish = useCallback<UseActiveResumeReturn['publish']>(async () => {
    if (!resumeId) return
    const { error } = await getSupabase().rpc('publish_resume', { resume_id: resumeId })
    if (error) throw new Error(error.message)
    // Refetch to get the new published_data + published_at
    const { data: refreshed } = await getSupabase()
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .maybeSingle<ResumeRow>()
    if (refreshed) setRow(refreshed)
  }, [resumeId])

  return {
    data,
    setData,
    status,
    lastSavedAt,
    shareMode: row?.share_mode ?? 'off',
    setShareMode,
    publishedData: (row?.published_data as ResumeData) ?? null,
    publishedAt: row?.published_at ? new Date(row.published_at) : null,
    publish,
    signedIn: Boolean(user),
    slug: row?.slug ?? null,
    name: row?.name ?? '',
  }
}
```

- [ ] **Step 2: Delete the old hook**

```bash
git rm src/hooks/useResume.ts
```

- [ ] **Step 3: Update `src/pages/ResumeBuilder.tsx`**

Replace the imports for the old hook:

```tsx
// remove these:
import { useResume, type UseResumeReturn } from '@/hooks/useResume'

// add these:
import { useResumes } from '@/hooks/useResumes'
import { useActiveResume } from '@/hooks/useActiveResume'
```

Replace the hook call near the top of the component. Find:

```tsx
const { data, setData, status, lastSavedAt, signedIn } = useResume()
```

Replace with (only what we consume now — Task 8 will expand the destructure):

```tsx
const { activeId } = useResumes()
const active = useActiveResume(activeId)
const { data, setData, status, lastSavedAt, signedIn } = active
```

Update the `renderActiveEditor` signature that currently typed `setData` against `UseResumeReturn['setData']`:

```tsx
function renderActiveEditor(
  key: SectionKey,
  data: ResumeData,
  setData: (u: ResumeData | ((p: ResumeData) => ResumeData)) => void,
) {
  // body unchanged
}
```

Remove any remaining `UseResumeReturn` references.

- [ ] **Step 4: Type-check**

```bash
npx tsc -p tsconfig.app.json --noEmit
```
Expected: no errors.

- [ ] **Step 5: Lint**

```bash
npm run lint
```
Expected: no errors.

- [ ] **Step 6: Dev server smoke**

```bash
npm run dev
```

In browser (`http://localhost:5173`):
1. Page loads. Editor works for anon user (unchanged behaviour).
2. Sign in with your test email. Magic link → return to app.
3. Editor shows your previously-saved resume (the legacy row that got backfilled). Type in a field, wait ~1s, watch the status chip go `Saving… → Saved`.
4. Reload the page. Data persists.
5. DevTools → Network → watch for `PATCH /rest/v1/resumes?id=eq.xxx` (the new per-id write).

Stop the dev server (`Ctrl-C`).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(hooks): replace useResume with useActiveResume keyed by resume_id

Reads and writes a single resumes row by id, exposes share_mode and
published_* fields plus a publish() that calls the publish_resume RPC.
ResumeBuilder now drives the editor from useResumes().activeId →
useActiveResume(activeId). Anon fallback to the localStorage draft is
preserved so the pre-signin entry point is unchanged."
```

---

## Task 7: `NewResumeDialog` component

**Files:**
- Create: `src/components/resume/NewResumeDialog.tsx`

- [ ] **Step 1: Create `src/components/resume/NewResumeDialog.tsx`**

```tsx
import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { slugify, isValidSlug } from '@/lib/slug'

export interface NewResumeDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (input: { name: string; slug: string }) => Promise<void>
  title: string                         // "New resume" | "Duplicate resume"
  submitLabel: string                   // "Create" | "Duplicate"
  initialName?: string
  initialSlug?: string
  existingSlugs: string[]
}

export default function NewResumeDialog({
  open,
  onClose,
  onSubmit,
  title,
  submitLabel,
  initialName = '',
  initialSlug = '',
  existingSlugs,
}: NewResumeDialogProps) {
  const [name, setName] = useState(initialName)
  const [slug, setSlug] = useState(initialSlug)
  const [slugTouched, setSlugTouched] = useState(Boolean(initialSlug))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(initialName)
      setSlug(initialSlug)
      setSlugTouched(Boolean(initialSlug))
      setError(null)
    }
  }, [open, initialName, initialSlug])

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name))
  }, [name, slugTouched])

  const existing = useMemo(() => new Set(existingSlugs), [existingSlugs])

  const validation: string | null = (() => {
    if (!name.trim()) return 'Name is required.'
    if (!slug) return 'Slug is required.'
    if (!isValidSlug(slug))
      return 'Slug: lowercase letters, numbers, hyphens; 2–64 chars, no leading/trailing hyphen.'
    if (existing.has(slug)) return 'You already have a resume with that slug.'
    return null
  })()

  const canSubmit = !validation && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({ name: name.trim(), slug })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-24"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full max-w-md rounded-xl border border-border bg-bg-card p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 className="font-display text-xl text-text-primary">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-md p-1 text-text-muted hover:bg-surface hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="field-label" htmlFor="new-resume-name">Name</label>
                <input
                  id="new-resume-name"
                  className="field-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Frontend"
                  autoFocus
                />
              </div>
              <div>
                <label className="field-label" htmlFor="new-resume-slug">URL slug</label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-text-muted">/@handle/</span>
                  <input
                    id="new-resume-slug"
                    className="field-input flex-1"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value.toLowerCase())
                      setSlugTouched(true)
                    }}
                    placeholder="frontend"
                  />
                </div>
                <p className="mt-1 text-[0.7rem] text-text-muted">
                  Frozen after creation — pick carefully.
                </p>
              </div>
              {(validation || error) && (
                <p className="field-error-msg">{error ?? validation}</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg px-4 py-2 text-sm text-text-secondary hover:bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Working…' : submitLabel}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Type-check + lint**

```bash
npx tsc -p tsconfig.app.json --noEmit
npm run lint
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/resume/NewResumeDialog.tsx
git commit -m "feat(resume): add NewResumeDialog used for new + duplicate flows

Single modal component parameterised by title / submit label /
initial values. Live slug derivation from name (until user edits
slug directly), client-side duplicate slug check against existing
list, bubbles server errors for anything the client can't catch."
```

---

## Task 8: `ResumeSwitcher` component + wire into header

**Files:**
- Create: `src/components/resume/ResumeSwitcher.tsx`
- Modify: `src/pages/ResumeBuilder.tsx`

- [ ] **Step 1: Create `src/components/resume/ResumeSwitcher.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Plus, MoreVertical, Copy, Pencil, Trash2, Check } from 'lucide-react'
import type { ResumeRow } from '@/lib/supabase'

export interface ResumeSwitcherProps {
  resumes: ResumeRow[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDuplicate: (id: string) => void
  onRename: (id: string) => void
  onDelete: (id: string) => void
}

function relativeShort(from: string): string {
  const diff = Math.max(0, Date.now() - new Date(from).getTime()) / 1000
  if (diff < 60) return 'now'
  const mins = Math.round(diff / 60)
  if (mins < 60) return `${mins}m`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.round(hrs / 24)
  return `${days}d`
}

function shareDot(mode: ResumeRow['share_mode']) {
  if (mode === 'live') return 'bg-accent'
  if (mode === 'snapshot') return 'bg-accent/50'
  return 'bg-border'
}

export default function ResumeSwitcher({
  resumes,
  activeId,
  onSelect,
  onNew,
  onDuplicate,
  onRename,
  onDelete,
}: ResumeSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [kebabId, setKebabId] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const active = resumes.find((r) => r.id === activeId) ?? resumes[0]

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setKebabId(null)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setKebabId(null)
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!active) return null

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-primary transition-colors hover:border-border-hover"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${shareDot(active.share_mode)}`} />
        <span className="font-medium">{active.name}</span>
        <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-xl border border-border bg-bg-card shadow-xl"
        >
          <ul className="max-h-80 overflow-y-auto py-1">
            {resumes.map((r) => {
              const isActive = r.id === active.id
              return (
                <li key={r.id} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(r.id)
                      setOpen(false)
                    }}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-surface ${isActive ? 'bg-surface' : ''}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${shareDot(r.share_mode)}`} />
                    <span className="flex-1 truncate">{r.name}</span>
                    <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-text-muted">
                      {relativeShort(r.updated_at)}
                    </span>
                    {isActive && <Check className="h-3.5 w-3.5 text-accent" />}
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label="Resume options"
                      onClick={(e) => {
                        e.stopPropagation()
                        setKebabId((k) => (k === r.id ? null : r.id))
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          e.stopPropagation()
                          setKebabId((k) => (k === r.id ? null : r.id))
                        }
                      }}
                      className="ml-1 rounded p-1 text-text-muted hover:bg-bg-elevated"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </span>
                  </button>
                  {kebabId === r.id && (
                    <div
                      role="menu"
                      className="absolute right-2 top-10 z-50 w-44 overflow-hidden rounded-lg border border-border bg-bg-elevated shadow-xl"
                    >
                      <button
                        type="button"
                        onClick={() => { setKebabId(null); setOpen(false); onRename(r.id) }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-surface"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => { setKebabId(null); setOpen(false); onDuplicate(r.id) }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-surface"
                      >
                        <Copy className="h-3.5 w-3.5" /> Duplicate
                      </button>
                      <button
                        type="button"
                        onClick={() => { setKebabId(null); setOpen(false); onDelete(r.id) }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-surface"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
          <button
            type="button"
            onClick={() => { setOpen(false); onNew() }}
            className="flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-sm text-accent transition-colors hover:bg-surface"
          >
            <Plus className="h-3.5 w-3.5" />
            New resume
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Wire switcher + dialogs into `ResumeBuilder.tsx`**

Add imports at the top of the file (with existing imports):

```tsx
import ResumeSwitcher from '@/components/resume/ResumeSwitcher'
import NewResumeDialog from '@/components/resume/NewResumeDialog'
import { slugify } from '@/lib/slug'
```

Below the existing hooks, replace the partial destructure from Task 6 with the full one, and add dialog state:

```tsx
const {
  resumes,
  activeId,
  setActiveId,
  create,
  duplicate,
  rename,
  remove,
} = useResumes()
const active = useActiveResume(activeId)
const { data, setData, status, lastSavedAt, signedIn } = active

const [newOpen, setNewOpen] = useState(false)
const [duplicateFrom, setDuplicateFrom] = useState<ResumeRow | null>(null)
const [renameTarget, setRenameTarget] = useState<ResumeRow | null>(null)
const [renameValue, setRenameValue] = useState('')
const [deleteTarget, setDeleteTarget] = useState<ResumeRow | null>(null)
```

Add an import for `ResumeRow`:

```tsx
import type { ResumeRow } from '@/lib/supabase'
```

In the header JSX, where the current header has `<div className="flex items-center gap-3">` containing `AuthBar` and the Download button, add the switcher to the left side (inside the `<div>` that holds the title block — below the `statusChip` row):

```tsx
{signedIn && resumes.length > 0 && (
  <div className="mt-3">
    <ResumeSwitcher
      resumes={resumes}
      activeId={activeId}
      onSelect={setActiveId}
      onNew={() => setNewOpen(true)}
      onDuplicate={(id) => {
        const src = resumes.find((r) => r.id === id)
        if (src) setDuplicateFrom(src)
      }}
      onRename={(id) => {
        const src = resumes.find((r) => r.id === id)
        if (src) {
          setRenameTarget(src)
          setRenameValue(src.name)
        }
      }}
      onDelete={(id) => {
        const src = resumes.find((r) => r.id === id)
        if (src) setDeleteTarget(src)
      }}
    />
  </div>
)}
```

At the bottom of the page return (just before the hidden print container), render the dialogs:

```tsx
<NewResumeDialog
  open={newOpen}
  onClose={() => setNewOpen(false)}
  onSubmit={async ({ name, slug }) => {
    await create({ name, slug })
  }}
  title="New resume"
  submitLabel="Create"
  existingSlugs={resumes.map((r) => r.slug)}
/>

<NewResumeDialog
  open={Boolean(duplicateFrom)}
  onClose={() => setDuplicateFrom(null)}
  onSubmit={async ({ name, slug }) => {
    if (duplicateFrom) await duplicate(duplicateFrom.id, name, slug)
  }}
  title="Duplicate resume"
  submitLabel="Duplicate"
  initialName={duplicateFrom ? `${duplicateFrom.name} (copy)` : ''}
  initialSlug={duplicateFrom ? slugify(`${duplicateFrom.slug}-copy`) : ''}
  existingSlugs={resumes.map((r) => r.slug)}
/>

{renameTarget && (
  <div
    className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-24"
    onClick={() => setRenameTarget(null)}
  >
    <div
      className="w-full max-w-md rounded-xl border border-border bg-bg-card p-6 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="mb-4 font-display text-xl text-text-primary">Rename resume</h2>
      <label className="field-label" htmlFor="rename-input">Name</label>
      <input
        id="rename-input"
        className="field-input"
        value={renameValue}
        onChange={(e) => setRenameValue(e.target.value)}
        autoFocus
      />
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setRenameTarget(null)}
          className="rounded-lg px-4 py-2 text-sm text-text-secondary hover:bg-surface"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!renameValue.trim()}
          onClick={async () => {
            await rename(renameTarget.id, renameValue.trim())
            setRenameTarget(null)
          }}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
        >
          Rename
        </button>
      </div>
    </div>
  </div>
)}

{deleteTarget && (
  <div
    className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-24"
    onClick={() => setDeleteTarget(null)}
  >
    <div
      className="w-full max-w-md rounded-xl border border-border bg-bg-card p-6 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="mb-2 font-display text-xl text-text-primary">
        Delete "{deleteTarget.name}"?
      </h2>
      <p className="mb-6 text-sm text-text-secondary">
        This can't be undone. Any public link will stop working immediately.
      </p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setDeleteTarget(null)}
          className="rounded-lg px-4 py-2 text-sm text-text-secondary hover:bg-surface"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={async () => {
            await remove(deleteTarget.id)
            setDeleteTarget(null)
          }}
          className="rounded-lg bg-red-500/90 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 3: Type-check + lint**

```bash
npx tsc -p tsconfig.app.json --noEmit
npm run lint
```
Expected: no errors.

- [ ] **Step 4: Browser smoke**

```bash
npm run dev
```

Signed-in flow:
1. Switcher appears under the status chip showing your current resume.
2. Click "New resume" → dialog opens → enter "Frontend" / slug auto-fills → Create → switcher shows both resumes, Frontend is active, empty editor.
3. Type in the editor — save status chip works.
4. Open switcher → kebab on Frontend → Duplicate → dialog pre-filled "Frontend (copy)" / "frontend-copy" → Duplicate → becomes active.
5. Kebab → Rename → change name → switcher updates.
6. Kebab → Delete → confirm → switcher drops the row, another resume becomes active.
7. Delete the last remaining resume → auto-creates "My resume".

Stop dev server.

- [ ] **Step 5: Commit**

```bash
git add src/components/resume/ResumeSwitcher.tsx src/pages/ResumeBuilder.tsx
git commit -m "feat(resume): add switcher UI + new/duplicate/rename/delete flows

Header dropdown lists all of the user's resumes with share-mode dot
and relative last-edited, per-row kebab for duplicate/rename/delete,
and a + New resume footer action. Integrates NewResumeDialog for the
new + duplicate modals, plus inline rename and delete confirm dialogs."
```

---

## Task 9: `HandleClaimDialog` component

**Files:**
- Create: `src/components/resume/HandleClaimDialog.tsx`

- [ ] **Step 1: Create `src/components/resume/HandleClaimDialog.tsx`**

```tsx
import { useState } from 'react'
import { validateHandle, handleErrorMessage } from '@/lib/slug'

export interface HandleClaimDialogProps {
  onClaim: (handle: string) => Promise<void>
}

/**
 * Inline view (not a modal wrapper) rendered inside SharePanel when the
 * user has no handle yet. Once claimed, SharePanel transitions to its
 * normal share-mode UI.
 */
export default function HandleClaimDialog({ onClaim }: HandleClaimDialogProps) {
  const [value, setValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const validation = value ? validateHandle(value) : null
  const clientError =
    validation && !validation.ok ? handleErrorMessage(validation.reason) : null
  const error = serverError ?? clientError

  async function submit() {
    if (!validation?.ok || submitting) return
    setSubmitting(true)
    setServerError(null)
    try {
      await onClaim(value)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Claim failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h3 className="mb-2 font-display text-lg text-text-primary">Pick your handle</h3>
      <p className="mb-4 text-sm text-text-secondary">
        This is the <span className="font-mono">@</span> part of your public resume URL.
        You can't change it later.
      </p>
      <label className="field-label" htmlFor="handle-input">Handle</label>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-text-muted">resumef.vercel.app/@</span>
        <input
          id="handle-input"
          className="field-input flex-1"
          value={value}
          onChange={(e) => {
            setValue(e.target.value.toLowerCase())
            setServerError(null)
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          placeholder="denis"
          autoFocus
        />
      </div>
      {error && <p className="field-error-msg mt-2">{error}</p>}
      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={submit}
          disabled={!validation?.ok || submitting}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Claiming…' : 'Claim handle'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check + lint**

```bash
npx tsc -p tsconfig.app.json --noEmit
npm run lint
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/resume/HandleClaimDialog.tsx
git commit -m "feat(resume): add HandleClaimDialog inline view for SharePanel

Standalone section rendered inside SharePanel when the user has no
handle yet. Handles client-side validation (length, charset, reserved),
calls the provided claim(), surfaces server errors from claim_handle
RPC (taken, reserved, already-claimed)."
```

---

## Task 10: `SharePanel` component

**Files:**
- Create: `src/components/resume/SharePanel.tsx`

- [ ] **Step 1: Create `src/components/resume/SharePanel.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Copy, CheckCircle2, ExternalLink } from 'lucide-react'
import type { ShareMode } from '@/lib/supabase'
import type { ResumeData } from '@/types/resume'
import HandleClaimDialog from './HandleClaimDialog'

export interface SharePanelProps {
  open: boolean
  onClose: () => void

  handle: string | null
  onClaimHandle: (handle: string) => Promise<void>

  slug: string | null
  shareMode: ShareMode
  onSetShareMode: (mode: ShareMode) => Promise<void>

  data: ResumeData
  publishedData: ResumeData | null
  onPublish: () => Promise<void>
}

function publicUrl(handle: string, slug: string): string {
  return `https://resumef.vercel.app/@${handle}/${slug}`
}

function hasUnpublishedChanges(data: ResumeData, published: ResumeData | null): boolean {
  if (!published) return true
  return JSON.stringify(data) !== JSON.stringify(published)
}

export default function SharePanel({
  open,
  onClose,
  handle,
  onClaimHandle,
  slug,
  shareMode,
  onSetShareMode,
  data,
  publishedData,
  onPublish,
}: SharePanelProps) {
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) setCopied(false)
  }, [open])

  async function doSet(mode: ShareMode) {
    setBusy(true)
    try {
      await onSetShareMode(mode)
    } finally {
      setBusy(false)
    }
  }

  async function doPublish() {
    setBusy(true)
    try {
      await onPublish()
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    if (!handle || !slug) return
    await navigator.clipboard.writeText(publicUrl(handle, slug))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const url = handle && slug ? publicUrl(handle, slug) : null
  const unpublished = shareMode === 'snapshot' && hasUnpublishedChanges(data, publishedData)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-24"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full max-w-md rounded-xl border border-border bg-bg-card p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 className="font-display text-xl text-text-primary">Share this resume</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-md p-1 text-text-muted hover:bg-surface hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!handle ? (
              <HandleClaimDialog onClaim={onClaimHandle} />
            ) : (
              <div className="space-y-5">
                <fieldset className="space-y-2">
                  <legend className="field-label mb-1">Sharing mode</legend>
                  {(['off', 'live', 'snapshot'] as ShareMode[]).map((mode) => (
                    <label
                      key={mode}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                        shareMode === mode
                          ? 'border-accent bg-accent/5'
                          : 'border-border hover:border-border-hover'
                      }`}
                    >
                      <input
                        type="radio"
                        name="share-mode"
                        value={mode}
                        checked={shareMode === mode}
                        disabled={busy}
                        onChange={() => doSet(mode)}
                        className="mt-1 accent-accent"
                      />
                      <span className="flex-1">
                        <span className="block text-sm font-medium text-text-primary">
                          {mode === 'off' && 'Off'}
                          {mode === 'live' && 'Live'}
                          {mode === 'snapshot' && 'Snapshot'}
                        </span>
                        <span className="block text-xs text-text-secondary">
                          {mode === 'off' && 'Not publicly accessible.'}
                          {mode === 'live' && 'Public URL always reflects the latest edits.'}
                          {mode === 'snapshot' && 'Public URL shows the last published version.'}
                        </span>
                      </span>
                    </label>
                  ))}
                </fieldset>

                {shareMode !== 'off' && url && (
                  <div>
                    <span className="field-label">Public URL</span>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 truncate rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs text-text-primary">
                        {url}
                      </code>
                      <button
                        type="button"
                        onClick={copy}
                        aria-label="Copy URL"
                        className="rounded-md border border-border bg-surface p-2 text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
                      >
                        {copied ? <CheckCircle2 className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                      </button>
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Open in new tab"
                        className="rounded-md border border-border bg-surface p-2 text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                )}

                {shareMode === 'snapshot' && (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3">
                    <div>
                      <p className="text-sm text-text-primary">
                        {publishedData ? 'Snapshot published' : 'Not yet published'}
                      </p>
                      {unpublished && (
                        <p className="text-xs text-accent">Unpublished changes</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={doPublish}
                      disabled={busy}
                      className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-accent-hover disabled:opacity-60"
                    >
                      {publishedData ? 'Update' : 'Publish'}
                    </button>
                  </div>
                )}

                {shareMode !== 'off' && (
                  <button
                    type="button"
                    onClick={() => doSet('off')}
                    disabled={busy}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary disabled:opacity-60"
                  >
                    Stop sharing
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Type-check + lint**

```bash
npx tsc -p tsconfig.app.json --noEmit
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add src/components/resume/SharePanel.tsx
git commit -m "feat(resume): add SharePanel with mode toggle, publish, handle claim

One modal handles both handle-claim (when missing) and share controls:
Off/Live/Snapshot radios with inline descriptions, public URL with
copy + open-in-new-tab, Publish/Update button plus 'Unpublished
changes' indicator in snapshot mode, and Stop sharing as a secondary
action."
```

---

## Task 11: `ShareButton` + wire into `ResumeBuilder` header

**Files:**
- Create: `src/components/resume/ShareButton.tsx`
- Modify: `src/pages/ResumeBuilder.tsx`

- [ ] **Step 1: Create `src/components/resume/ShareButton.tsx`**

```tsx
import { Share2 } from 'lucide-react'
import type { ShareMode } from '@/lib/supabase'

export interface ShareButtonProps {
  shareMode: ShareMode
  onClick: () => void
  disabled?: boolean
}

function chipLabel(mode: ShareMode): string | null {
  if (mode === 'live') return 'Live'
  if (mode === 'snapshot') return 'Snapshot'
  return null
}

export default function ShareButton({ shareMode, onClick, disabled }: ShareButtonProps) {
  const chip = chipLabel(shareMode)
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text-primary transition-colors hover:border-border-hover disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Share2 className="h-4 w-4" />
      Share
      {chip && (
        <span
          className={`ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.16em] ${
            shareMode === 'live'
              ? 'bg-accent/10 text-accent'
              : 'bg-surface-hover text-text-secondary'
          }`}
        >
          <span
            className={`h-1 w-1 rounded-full ${shareMode === 'live' ? 'bg-accent' : 'bg-accent/50'}`}
          />
          {chip}
        </span>
      )}
    </button>
  )
}
```

- [ ] **Step 2: Wire `ShareButton` + `SharePanel` + `useProfile` into `ResumeBuilder.tsx`**

Add imports:

```tsx
import ShareButton from '@/components/resume/ShareButton'
import SharePanel from '@/components/resume/SharePanel'
import { useProfile } from '@/hooks/useProfile'
```

In the component body, after `useActiveResume`:

```tsx
const { handle, claim: claimHandle } = useProfile()
const [shareOpen, setShareOpen] = useState(false)
```

In the header JSX, inside the `<div className="flex items-center gap-3">` that contains `AuthBar` and the Download button, insert ShareButton before the Download button:

```tsx
{signedIn && activeId && (
  <ShareButton
    shareMode={active.shareMode}
    onClick={() => setShareOpen(true)}
  />
)}
```

At the bottom of the return (near the other dialogs from Task 8), add:

```tsx
<SharePanel
  open={shareOpen}
  onClose={() => setShareOpen(false)}
  handle={handle}
  onClaimHandle={claimHandle}
  slug={active.slug}
  shareMode={active.shareMode}
  onSetShareMode={active.setShareMode}
  data={active.data}
  publishedData={active.publishedData}
  onPublish={active.publish}
/>
```

- [ ] **Step 3: Type-check + lint**

```bash
npx tsc -p tsconfig.app.json --noEmit
npm run lint
```

- [ ] **Step 4: Browser smoke (end-to-end share flow)**

```bash
npm run dev
```

Signed-in flow:
1. Share button appears next to Download PDF.
2. Click Share → SharePanel opens → handle-claim view (since no profile row yet).
3. Try `admin` → server rejects "handle reserved".
4. Try `A!` → client rejects format.
5. Enter `denis` → Claim → panel transitions to mode selector.
6. Select **Live** → URL appears with `resumef.vercel.app/@denis/<slug>`. Copy works.
7. Open URL in new tab → expect a 404/blank page for now (PublicResume page is Task 12, not yet implemented).
8. Switch to **Snapshot** → "Not yet published". Click Publish → chip becomes "Snapshot published".
9. Edit a field in the editor → SharePanel shows "Unpublished changes" when reopened. Click Update → chip clears.
10. Click Stop sharing → mode returns to Off, URL disappears.

Stop dev server.

- [ ] **Step 5: Commit**

```bash
git add src/components/resume/ShareButton.tsx src/pages/ResumeBuilder.tsx
git commit -m "feat(resume): wire ShareButton + SharePanel into the editor header

Share button sits next to Download PDF, shows a Live/Snapshot chip
when active. Opens SharePanel which handles the lazy handle-claim
path and all sharing controls. Public URLs aren't routable yet —
PublicResume component lands in the next task."
```

---

## Task 12: `PublicResume` page

**Files:**
- Create: `src/lib/publicResume.ts`
- Create: `src/pages/PublicResume.tsx`

- [ ] **Step 1: Create `src/lib/publicResume.ts`**

```ts
import { getSupabase, isSupabaseConfigured, type PublicResumeRow } from '@/lib/supabase'

export async function fetchPublicResume(
  handle: string,
  slug: string,
): Promise<PublicResumeRow | null> {
  if (!isSupabaseConfigured) return null
  const { data, error } = await getSupabase()
    .from('public_resumes')
    .select('*')
    .eq('handle', handle)
    .eq('slug', slug)
    .maybeSingle<PublicResumeRow>()
  if (error) return null
  return data ?? null
}
```

- [ ] **Step 2: Create `src/pages/PublicResume.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Download, Loader2 } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'
import ResumePreview from '@/components/resume/ResumePreview'
import ResumeDocument from '@/components/resume/ResumeDocument'
import { fetchPublicResume } from '@/lib/publicResume'
import { pdfFileName } from '@/lib/resumeFormat'
import { RESUME_PRINT_PAGE_STYLE } from '@/lib/resumePrintStyle'
import { emptyResume, type ResumeData } from '@/types/resume'

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; data: ResumeData; name: string }
  | { kind: 'not-found' }

export default function PublicResume() {
  const { handle, slug } = useParams<{ handle: string; slug: string }>()
  const [state, setState] = useState<State>({ kind: 'loading' })
  const printRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Set noindex on the public view by default (v1 — no opt-in)
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => {
      document.head.removeChild(meta)
    }
  }, [])

  useEffect(() => {
    if (!handle || !slug) {
      setState({ kind: 'not-found' })
      return
    }
    let active = true
    fetchPublicResume(handle, slug).then((row) => {
      if (!active) return
      if (!row) setState({ kind: 'not-found' })
      else setState({
        kind: 'ready',
        data: { ...emptyResume(), ...row.data },
        name: row.name,
      })
    })
    return () => { active = false }
  }, [handle, slug])

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle:
      state.kind === 'ready'
        ? pdfFileName(state.data.personal).replace(/\.pdf$/, '')
        : 'resume',
    pageStyle: RESUME_PRINT_PAGE_STYLE,
  })

  if (state.kind === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-text-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  if (state.kind === 'not-found') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 py-10 text-center">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-accent">
          404
        </p>
        <h1 className="font-display text-3xl text-text-primary">Resume not found</h1>
        <p className="max-w-sm text-sm text-text-secondary">
          This link may have been removed, renamed, or never existed. If someone
          shared it with you, ask them for the current URL.
        </p>
        <a
          href="/"
          className="mt-3 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-text-muted hover:text-text-primary"
        >
          Resumefolio →
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-6 py-3 backdrop-blur">
        <a
          href="/"
          className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-text-muted transition-colors hover:text-text-primary"
        >
          Resumefolio
        </a>
        <button
          type="button"
          onClick={() => handlePrint()}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-accent-hover"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </button>
      </header>

      <main className="mx-auto max-w-[820px] px-4 py-10">
        <ResumePreview data={state.data} />
      </main>

      <footer className="px-6 pb-10 text-center">
        <a
          href="/"
          className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-text-muted transition-colors hover:text-text-primary"
        >
          Made with Resumefolio
        </a>
      </footer>

      {/* Hidden print target */}
      <div
        aria-hidden="true"
        style={{ position: 'fixed', left: '-10000px', top: 0, width: '8.5in' }}
      >
        <div ref={printRef}>
          <ResumeDocument data={state.data} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Type-check + lint**

```bash
npx tsc -p tsconfig.app.json --noEmit
npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/publicResume.ts src/pages/PublicResume.tsx
git commit -m "feat(resume): add PublicResume page for /@handle/slug

Thin wrapper around ResumePreview: sticky brand top bar, Download
PDF button (reuses the existing react-to-print + ResumeDocument
plumbing), discreet footer. Injects a runtime-only <meta
name='robots' content='noindex,nofollow'> so shared links don't end
up in search indexes by default. 404 view on missing rows."
```

---

## Task 13: Route + production smoke

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update `src/App.tsx`**

Final contents:

```tsx
import { Routes, Route } from 'react-router-dom'
import ResumeBuilder from './pages/ResumeBuilder'
import PublicResume from './pages/PublicResume'
import MobileBlock from './components/MobileBlock'
import { useIsMobile } from './hooks/useIsMobile'

export default function App() {
  const isMobile = useIsMobile()

  if (isMobile) return <MobileBlock />

  return (
    <Routes>
      <Route path="/@:handle/:slug" element={<PublicResume />} />
      <Route path="/" element={<ResumeBuilder />} />
    </Routes>
  )
}
```

Note: React Router 7 accepts `@` in a path segment fine — the `:handle` param captures everything after `@` up to the next `/`. Confirmed at runtime in Task 13 Step 3.

- [ ] **Step 2: Type-check + build**

```bash
npx tsc -p tsconfig.app.json --noEmit
npm run build
```
Expected: build succeeds.

- [ ] **Step 3: Full end-to-end browser smoke**

```bash
npm run dev
```

Flow:
1. Visit `/` — editor loads (signed in).
2. Open SharePanel on an active resume, set mode to **Live**, copy the URL.
3. Paste the URL in a new **incognito** window (anon session) — PublicResume renders your resume. Top bar shows Download PDF. Click it — PDF downloads fine.
4. Back in the main window, edit a field. Wait for save. Incognito — refresh. Changes appear (live mode).
5. Switch to **Snapshot**, click Publish. Edit a field. Wait for save. Incognito — refresh. **Old** state still shows (snapshot is frozen). Back in main, click Update. Incognito — refresh. **New** state.
6. Stop sharing. Incognito refresh → 404 page.
7. Visit a bogus URL like `/@nobody/resume` → 404 page.
8. Visit `/@denis/does-not-exist` → 404 page.
9. Inspect the PublicResume DOM in DevTools — `<meta name="robots" content="noindex, nofollow">` is present.

Stop dev server.

- [ ] **Step 4: Anon REST smoke (RLS sanity check)**

Run (replace `$KEY` with the anon key from `.env`):

```bash
curl -s "https://<your-supabase-url>/rest/v1/resumes?select=*" \
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY" | head -5
```
Expected: `[]` (anon has zero direct access to `resumes`).

```bash
curl -s "https://<your-supabase-url>/rest/v1/public_resumes?select=*" \
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY" | head -5
```
Expected: JSON array of only `share_mode != 'off'` rows.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat(routes): mount PublicResume at /@:handle/:slug

With the route wired, sharing flows end-to-end: live mode reflects
edits, snapshot mode requires explicit publish, deleted/stopped
resumes 404, and anon REST smoke confirms resumes is unreachable
directly (only public_resumes is)."
```

---

## Task 14: Push + open PR

**Files:** none (git only)

- [ ] **Step 1: Final type-check, lint, build**

```bash
npx tsc -p tsconfig.app.json --noEmit
npm run lint
npm run build
```
All three must pass with no errors.

- [ ] **Step 2: Push**

```bash
git push -u origin feat/multi-resume-sharing
```

- [ ] **Step 3: Open PR**

```bash
gh pr create --title "feat: multi-resume + public /@handle/slug sharing" --body "$(cat <<'EOF'
## Summary
Implements the approved spec at docs/superpowers/specs/2026-04-18-multi-resume-sharing-design.md.

- Schema migration: resumes (many per user) + profiles (handles) + reserved_handles + public_resumes view + claim_handle / publish_resume RPCs. Legacy single-row data is backfilled as slug=resume / name="My resume".
- Editor UI: header switcher with kebab per row (duplicate / rename / delete), +New resume flow, auto-fallback on last-delete.
- Sharing: Off / Live / Snapshot per resume. Live reflects current data; Snapshot requires explicit Publish/Update and shows an "Unpublished changes" indicator.
- Handles: claimed lazily on first share, immutable, validated client + server + reserved list.
- Public page: /@handle/slug renders existing ResumePreview inside a thin brand wrapper with Download PDF, 404 for missing, noindex meta by default.

## Migration
Run `supabase/migrations/001-multi-resume.sql` in the Supabase SQL editor BEFORE deploying the new build. Keeps resumes_legacy until manual drop.

## Test plan
- [ ] `npm run lint` + `npm run build` clean
- [ ] Signed-in: create / duplicate / rename / delete flows work from the switcher
- [ ] Active resume auto-saves, status chip per-resume
- [ ] Share panel: Off → Live → URL serves current state; edits reflected
- [ ] Share panel: Off → Snapshot → Publish → edit → public shows OLD state → Update → public shows NEW state
- [ ] Stop sharing → public URL 404s
- [ ] Anon REST fetch of /rest/v1/resumes returns []
- [ ] Pre-existing users see their legacy resume as "My resume" (slug: resume), data intact

## Follow-up (out of scope)
- Drop resumes_legacy after verification
- View analytics, password-protected links, slug renames, soft delete — all explicitly YAGNI'd in the spec
EOF
)"
```

- [ ] **Step 4: Merge the PR**

```bash
gh pr merge --squash --delete-branch
```

- [ ] **Step 5: Production smoke**

Wait for Vercel to redeploy (1–2 min). Then on production (`https://resumef.vercel.app`):
1. Sign in.
2. Create + share a test resume → open public URL → renders.
3. Publish a snapshot, edit, refresh public URL → old state until Update.
4. Delete the test resume → public 404.

If anything breaks in production that didn't break in dev, roll back via Vercel dashboard and debug locally first.

- [ ] **Step 6: Clean up legacy data (optional, after verification)**

Only once you've confirmed the migration was clean and users' data is intact, run in Supabase SQL editor:

```sql
select count(*) from resumes;
select count(*) from resumes_legacy;
-- If these look right:
drop table public.resumes_legacy;
```

---

## Self-review checklist (author)

Before handing this plan off:

- [x] Every task has a commit step with an exact message.
- [x] Every UI task has a browser smoke step with concrete steps to perform.
- [x] Every SQL change runs in a transaction.
- [x] The public view's `security_invoker=off` matches the RLS strategy (anon reads go through the view, not the table).
- [x] `claim_handle` and `publish_resume` RPCs are `security definer`, revoked from `public`, granted only to `authenticated`.
- [x] All TypeScript types used in later tasks are defined in earlier tasks (`ShareMode`, `ResumeRow`, `ProfileRow`, `PublicResumeRow`, `ResumeData`).
- [x] The migration preserves legacy data; the greenfield SQL file is also updated for new installs.
- [x] The anon REST smoke is a required step, not an afterthought.
- [x] No `Co-Authored-By: Claude` trailer anywhere in the plan's commit templates.
