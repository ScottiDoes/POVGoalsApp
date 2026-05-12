-- ── Component Artifacts ───────────────────────────────────────
-- Screenshots captured during a meeting, linked to a specific
-- use-case component. Stored in the 'artifacts' Storage bucket.

create table public.component_artifacts (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references public.meeting_sessions(id) on delete cascade,
  prospect_id     uuid references public.pov_prospects(id) on delete set null,
  use_case_id     text not null,       -- snapshot UC id (text, not FK — snapshot data)
  component_name  text not null,
  storage_path    text not null,       -- full path inside the 'artifacts' bucket
  note            text,
  created_at      timestamptz not null default now()
);

create index on public.component_artifacts (session_id);
create index on public.component_artifacts (prospect_id);

alter table public.component_artifacts enable row level security;

create policy "Consultants manage own artifacts"
  on public.component_artifacts for all
  using (
    session_id in (
      select id from public.meeting_sessions where consultant_id = auth.uid()
    )
  )
  with check (
    session_id in (
      select id from public.meeting_sessions where consultant_id = auth.uid()
    )
  );

-- ── Storage bucket ────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'artifacts',
  'artifacts',
  false,
  10485760,   -- 10 MB per file
  array['image/png', 'image/jpeg', 'image/webp']
);

-- Path convention: {consultant_uid}/{session_id}/{use_case_id}/{component_slug}/{artifact_id}.png
-- RLS checks that the first path segment is the authenticated user's uid.

create policy "Consultants upload own artifacts"
  on storage.objects for insert
  with check (
    bucket_id = 'artifacts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Consultants read own artifacts"
  on storage.objects for select
  using (
    bucket_id = 'artifacts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Consultants delete own artifacts"
  on storage.objects for delete
  using (
    bucket_id = 'artifacts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
