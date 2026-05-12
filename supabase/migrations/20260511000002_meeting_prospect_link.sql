alter table public.meeting_sessions
  add column prospect_id uuid references public.pov_prospects(id) on delete set null;
