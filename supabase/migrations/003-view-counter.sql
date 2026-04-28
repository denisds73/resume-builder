-- Anonymous, aggregate-only view counter for published resumes.
-- We deliberately store no per-viewer data (no IPs, user agents, timestamps
-- per visit) — only a running integer. Sessionization happens client-side
-- via sessionStorage so a single recruiter scrolling once doesn't inflate
-- the number, but we don't actually know who they are.
--
-- The counter sits on the resumes table itself (not a separate events table)
-- so the dashboard read is one row per resume — no extra join, no aggregation.

begin;

-- ── 1. Counter column ────────────────────────────────────────────────────
alter table public.resumes
  add column if not exists view_count int not null default 0;

-- Surface the count on the public-resumes view so the share page can read
-- it back without needing the resumes table directly (it has no anon SELECT
-- policy, by design — anon goes through the view only).
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
  r.updated_at,
  r.view_count
from public.resumes r
join public.profiles p on p.user_id = r.user_id
where r.share_mode in ('live','snapshot');

grant select on public.public_resumes to anon, authenticated;

-- ── 2. RPC: increment a published resume's view count ───────────────────
-- security definer so anon can bump even though resumes has no anon update
-- policy. The RPC validates that the target is actually published — anon
-- can't inflate counts on private resumes by guessing IDs.
create or replace function public.increment_resume_view(p_handle text, p_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Don't count the owner peeking at their own share — that would inflate
  -- the number with self-checks. auth.uid() is null for anon, so anon
  -- visits always pass through.
  update public.resumes r
     set view_count = view_count + 1
    from public.profiles p
   where p.user_id = r.user_id
     and p.handle = p_handle
     and r.slug = p_slug
     and r.share_mode in ('live','snapshot')
     and (auth.uid() is null or auth.uid() <> r.user_id);
end;
$$;

revoke all on function public.increment_resume_view(text, text) from public;
grant execute on function public.increment_resume_view(text, text) to anon, authenticated;

commit;
