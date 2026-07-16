-- Extend Type Emotions review queue (run after supabase-type-emotion-search-events.sql).

alter table public.type_emotion_search_events
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by text,
  add column if not exists resolution text
    check (resolution is null or resolution in ('applied', 'dismissed', 'needs_content'));

create index if not exists type_emotion_search_events_unreviewed_idx
  on public.type_emotion_search_events (created_at desc)
  where reviewed_at is null;
