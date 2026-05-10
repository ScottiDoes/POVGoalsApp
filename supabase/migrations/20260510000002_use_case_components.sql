alter table public.use_cases_consultant
  add column components text[] not null default '{}';
