-- EasyBuilda — Genesis Pro (richer agents). Safe to re-run.
alter table public.agents add column if not exists faq jsonb not null default '[]'::jsonb;
alter table public.agents add column if not exists readiness_notes text;
alter table public.agents add column if not exists website_url text;