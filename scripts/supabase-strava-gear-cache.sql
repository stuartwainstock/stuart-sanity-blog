-- Gear (shoe) name cache for Strava runs.
-- Purpose: avoid live Strava /athlete + /gear/:id calls on the /runs render path;
-- populate this table during sync instead (see src/lib/strava/gearCache.ts).
--
-- Run in Supabase SQL editor (or migrations, if you use them).
-- Security: enable RLS with no policies so public API callers cannot read/write.

create table if not exists public.strava_gear_cache (
  gear_id text primary key,
  label text not null,
  updated_at timestamptz not null default now()
);

alter table public.strava_gear_cache enable row level security;

-- Reuses the shared set_updated_at() trigger function created by
-- supabase-strava-reverse-geocode-cache.sql. Run that script first if this
-- is the first cache table in this project.
drop trigger if exists strava_gear_cache_updated_at on public.strava_gear_cache;
create trigger strava_gear_cache_updated_at
before update on public.strava_gear_cache
for each row execute function public.set_updated_at();
