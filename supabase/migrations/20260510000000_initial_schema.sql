-- ============================================================
-- POV Win Goals App — Initial Schema
-- ============================================================

-- ── Enums ────────────────────────────────────────────────────

create type public.user_role as enum ('admin', 'consultant');
create type public.goal_status as enum ('not_started', 'in_progress', 'achieved');
create type public.next_step_type as enum (
  'technical_deep_dive',
  'pilot_scoping',
  'stakeholder_review',
  'send_materials',
  'other'
);

-- ── Profiles ─────────────────────────────────────────────────
-- Extends auth.users with role and display name.

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  name        text not null,
  role        public.user_role not null default 'consultant',
  created_at  timestamptz not null default now()
);

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Org Use Cases ─────────────────────────────────────────────
-- Admin-managed master library. All consultants can read.

create table public.use_cases_org (
  id               uuid primary key default gen_random_uuid(),
  pain_point_tag   text not null,
  before_text      text not null,
  after_text       text not null,
  roi_stat         text not null,
  roi_description  text not null,
  created_by       uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.artifacts_org (
  id            uuid primary key default gen_random_uuid(),
  use_case_id   uuid not null references public.use_cases_org(id) on delete cascade,
  storage_path  text not null,  -- path in Supabase Storage bucket
  file_name     text not null,
  mime_type     text not null,
  created_at    timestamptz not null default now()
);

-- ── Consultant Use Cases (Forks) ──────────────────────────────
-- Each consultant gets a copy of the org library on account creation.
-- org_use_case_id is null for personally-added use cases.

create table public.use_cases_consultant (
  id               uuid primary key default gen_random_uuid(),
  org_use_case_id  uuid references public.use_cases_org(id) on delete set null,
  consultant_id    uuid not null references public.profiles(id) on delete cascade,
  pain_point_tag   text not null,
  before_text      text not null,
  after_text       text not null,
  roi_stat         text not null,
  roi_description  text not null,
  is_hidden        boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.artifacts_consultant (
  id            uuid primary key default gen_random_uuid(),
  use_case_id   uuid not null references public.use_cases_consultant(id) on delete cascade,
  storage_path  text not null,
  file_name     text not null,
  mime_type     text not null,
  created_at    timestamptz not null default now()
);

-- ── POV Goals ─────────────────────────────────────────────────
-- Stored per consultant (not per meeting session at MVP).

create table public.pov_goals (
  id                   uuid primary key default gen_random_uuid(),
  consultant_id        uuid not null references public.profiles(id) on delete cascade,
  title                text not null,
  success_metric       text not null,
  status               public.goal_status not null default 'not_started',
  linked_use_case_ids  uuid[] not null default '{}',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ── Meeting Sessions ──────────────────────────────────────────

create table public.meeting_sessions (
  id                      uuid primary key default gen_random_uuid(),
  consultant_id           uuid not null references public.profiles(id) on delete cascade,
  prospect_name           text,
  prospect_company        text,
  resonated_use_case_ids  uuid[] not null default '{}',
  next_step               public.next_step_type,
  next_step_other         text,  -- free text when next_step = 'other'
  notes                   text,
  created_at              timestamptz not null default now()
);

-- ── updated_at triggers ───────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.use_cases_org
  for each row execute procedure public.set_updated_at();

create trigger set_updated_at before update on public.use_cases_consultant
  for each row execute procedure public.set_updated_at();

create trigger set_updated_at before update on public.pov_goals
  for each row execute procedure public.set_updated_at();

-- ── Indexes ───────────────────────────────────────────────────

create index on public.use_cases_consultant (consultant_id);
create index on public.use_cases_consultant (org_use_case_id);
create index on public.pov_goals (consultant_id);
create index on public.meeting_sessions (consultant_id);
create index on public.meeting_sessions (created_at desc);
create index on public.artifacts_org (use_case_id);
create index on public.artifacts_consultant (use_case_id);

-- ── Row Level Security ────────────────────────────────────────

alter table public.profiles               enable row level security;
alter table public.use_cases_org          enable row level security;
alter table public.artifacts_org          enable row level security;
alter table public.use_cases_consultant   enable row level security;
alter table public.artifacts_consultant   enable row level security;
alter table public.pov_goals              enable row level security;
alter table public.meeting_sessions       enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles
create policy "Users can read own profile"
  on public.profiles for select using (id = auth.uid());
create policy "Admins can read all profiles"
  on public.profiles for select using (public.is_admin());
create policy "Users can update own profile"
  on public.profiles for update using (id = auth.uid());

-- use_cases_org (read: all authenticated; write: admins only)
create policy "Authenticated users can read org use cases"
  on public.use_cases_org for select using (auth.uid() is not null);
create policy "Admins can insert org use cases"
  on public.use_cases_org for insert with check (public.is_admin());
create policy "Admins can update org use cases"
  on public.use_cases_org for update using (public.is_admin());
create policy "Admins can delete org use cases"
  on public.use_cases_org for delete using (public.is_admin());

-- artifacts_org
create policy "Authenticated users can read org artifacts"
  on public.artifacts_org for select using (auth.uid() is not null);
create policy "Admins can manage org artifacts"
  on public.artifacts_org for all using (public.is_admin());

-- use_cases_consultant
create policy "Consultants can read own use cases"
  on public.use_cases_consultant for select using (consultant_id = auth.uid());
create policy "Admins can read all consultant use cases"
  on public.use_cases_consultant for select using (public.is_admin());
create policy "Consultants can insert own use cases"
  on public.use_cases_consultant for insert with check (consultant_id = auth.uid());
create policy "Consultants can update own use cases"
  on public.use_cases_consultant for update using (consultant_id = auth.uid());
create policy "Consultants can delete own use cases"
  on public.use_cases_consultant for delete using (consultant_id = auth.uid());

-- artifacts_consultant
create policy "Consultants can read own artifacts"
  on public.artifacts_consultant for select
  using (
    exists (
      select 1 from public.use_cases_consultant
      where id = use_case_id and consultant_id = auth.uid()
    )
  );
create policy "Consultants can manage own artifacts"
  on public.artifacts_consultant for all
  using (
    exists (
      select 1 from public.use_cases_consultant
      where id = use_case_id and consultant_id = auth.uid()
    )
  );

-- pov_goals
create policy "Consultants can manage own goals"
  on public.pov_goals for all using (consultant_id = auth.uid());
create policy "Admins can read all goals"
  on public.pov_goals for select using (public.is_admin());

-- meeting_sessions
create policy "Consultants can manage own sessions"
  on public.meeting_sessions for all using (consultant_id = auth.uid());
create policy "Admins can read all sessions"
  on public.meeting_sessions for select using (public.is_admin());

-- ── Storage Buckets ───────────────────────────────────────────

insert into storage.buckets (id, name, public)
values
  ('org-artifacts',          'org-artifacts',          false),
  ('consultant-artifacts',   'consultant-artifacts',   false);

-- Org artifacts: admins write, all authenticated users read
create policy "Admins can upload org artifacts"
  on storage.objects for insert
  with check (bucket_id = 'org-artifacts' and public.is_admin());
create policy "Authenticated users can read org artifacts"
  on storage.objects for select
  using (bucket_id = 'org-artifacts' and auth.uid() is not null);
create policy "Admins can delete org artifacts"
  on storage.objects for delete
  using (bucket_id = 'org-artifacts' and public.is_admin());

-- Consultant artifacts: each consultant manages their own folder (consultant_id/*)
create policy "Consultants can upload own artifacts"
  on storage.objects for insert
  with check (
    bucket_id = 'consultant-artifacts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "Consultants can read own artifacts"
  on storage.objects for select
  using (
    bucket_id = 'consultant-artifacts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "Consultants can delete own artifacts"
  on storage.objects for delete
  using (
    bucket_id = 'consultant-artifacts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
