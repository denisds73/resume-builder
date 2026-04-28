-- Per-user default template id, applied when creating a new resume.
-- Nullable so existing rows don't need a backfill; the client falls back
-- to 'classic' when null. The check constraint mirrors the TemplateId
-- union in src/resume/templates so a typo can't land in the database.

alter table public.profiles
  add column if not exists default_template text
    check (default_template in ('classic', 'modern', 'minimal'));
