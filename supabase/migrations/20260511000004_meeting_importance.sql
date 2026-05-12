alter table public.meeting_sessions
  add column component_importance jsonb not null default '{}';
