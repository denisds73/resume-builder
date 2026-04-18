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
