-- Add meeting type to distinguish POV Kickoff from POV Continuation sessions.

create type public.meeting_type as enum ('kickoff', 'continuation');

alter table public.meeting_sessions
  add column meeting_type public.meeting_type not null default 'continuation';

create index on public.meeting_sessions (meeting_type);
