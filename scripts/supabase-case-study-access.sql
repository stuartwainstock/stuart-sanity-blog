-- Private case-study PDF + password material.
-- PDFs live in a private Storage bucket; salt/hash never sit in the public Sanity dataset.
--
-- Apply via Supabase SQL editor / MCP migration. Service role bypasses RLS for server routes.

create table if not exists public.case_study_access (
  slug text primary key,
  salt text not null,
  hash text not null,
  pdf_object_key text,
  original_filename text,
  mime_type text not null default 'application/pdf',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint case_study_access_slug_format check (slug ~ '^[a-z0-9-]+$')
);

alter table public.case_study_access enable row level security;
-- No policies: anon/authenticated cannot read or write. Server uses service role.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists case_study_access_updated_at on public.case_study_access;
create trigger case_study_access_updated_at
before update on public.case_study_access
for each row execute function public.set_updated_at();

-- Private bucket (not publicly readable).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'case-study-pdfs',
  'case-study-pdfs',
  false,
  52428800, -- 50 MiB
  array['application/pdf']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Deny public Storage access; service role bypasses RLS.
drop policy if exists "case_study_pdfs_no_public_select" on storage.objects;
drop policy if exists "case_study_pdfs_no_public_insert" on storage.objects;
drop policy if exists "case_study_pdfs_no_public_update" on storage.objects;
drop policy if exists "case_study_pdfs_no_public_delete" on storage.objects;

-- Explicit deny-by-absence: enable RLS with zero allow policies for this bucket's objects.
-- (Existing project-wide policies may still apply; keep bucket private + path checks in app.)
