-- Reverse geocode cache for Strava runs.
-- Purpose: avoid Nominatim calls on the /runs render path; populate this table during sync instead.
--
-- Run in Supabase SQL editor (or migrations, if you use them).
-- Security: enable RLS with no policies so public API callers cannot read/write.

create table if not exists public.strava_reverse_geocode_cache (
  bucket_key text primary key,
  label text not null,
  lat double precision not null,
  lng double precision not null,
  updated_at timestamptz not null default now()
);

alter table public.strava_reverse_geocode_cache enable row level security;

-- Optional: keep updated_at current on upsert/updates
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists strava_reverse_geocode_cache_updated_at on public.strava_reverse_geocode_cache;
create trigger strava_reverse_geocode_cache_updated_at
before update on public.strava_reverse_geocode_cache
for each row execute function public.set_updated_at();

