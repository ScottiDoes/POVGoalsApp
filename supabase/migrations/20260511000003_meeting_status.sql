alter table public.meeting_sessions
  add column status text not null default 'active'
  check (status in ('active', 'ended'));
