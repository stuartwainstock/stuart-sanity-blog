-- Combined Strava cache tables for /runs ISR (run once in Supabase SQL editor).
-- See scripts/setup-strava-cache-tables.mjs to verify tables exist after applying.

-- 1) Reverse geocode cache (Nominatim labels)
create table if not exists public.strava_reverse_geocode_cache (
  bucket_key text primary key,
  label text not null,
  lat double precision not null,
  lng double precision not null,
  updated_at timestamptz not null default now()
);

alter table public.strava_reverse_geocode_cache enable row level security;

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

-- 2) Gear (shoe) name cache
create table if not exists public.strava_gear_cache (
  gear_id text primary key,
  label text not null,
  updated_at timestamptz not null default now()
);

alter table public.strava_gear_cache enable row level security;

drop trigger if exists strava_gear_cache_updated_at on public.strava_gear_cache;
create trigger strava_gear_cache_updated_at
before update on public.strava_gear_cache
for each row execute function public.set_updated_at();
