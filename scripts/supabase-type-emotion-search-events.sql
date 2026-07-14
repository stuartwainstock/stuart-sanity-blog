-- Type Emotions lab: unmatched / flagged search capture for lexicon iteration.
-- Security: RLS on, no policies — only the Next.js service-role API can read/write.

create table if not exists public.type_emotion_search_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  query text not null,
  kind text not null check (kind in ('fallback', 'weak', 'feedback')),
  matched_emotion_id text,
  matched_via text,
  matched_on text,
  score numeric,
  user_agent text
);

create index if not exists type_emotion_search_events_created_at_idx
  on public.type_emotion_search_events (created_at desc);

create index if not exists type_emotion_search_events_kind_idx
  on public.type_emotion_search_events (kind);

alter table public.type_emotion_search_events enable row level security;
