alter table public.pov_prospects
  add column use_case_snapshot jsonb not null default '[]';
