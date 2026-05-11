create type public.component_status as enum (
  'not_started',
  'in_progress',
  'demo_approved',
  'complete',
  'disregarded'
);

create table public.pov_prospects (
  id                   uuid primary key default gen_random_uuid(),
  consultant_id        uuid not null references public.profiles(id) on delete cascade,
  org_name             text not null,
  contact_name         text,
  main_goals           text,
  kickoff_date         date,
  end_date             date,
  linked_use_case_ids  uuid[] not null default '{}',
  component_statuses   jsonb not null default '{}',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger set_updated_at before update on public.pov_prospects
  for each row execute procedure public.set_updated_at();

create index on public.pov_prospects (consultant_id);

alter table public.pov_prospects enable row level security;

create policy "Consultants manage own prospects"
  on public.pov_prospects for all
  using (consultant_id = auth.uid());
