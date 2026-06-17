-- EasyBuilda — Level 2 migration (Agent Engine). Run in Supabase → SQL Editor. Safe to re-run.

-- 1) Allow agents to exist before auth is wired (Level 4). FK still applies when user_id is set.
alter table public.agents alter column user_id drop not null;

-- 2) Agent extras produced by the builder
alter table public.agents add column if not exists business_name text;
alter table public.agents add column if not exists tagline text;
alter table public.agents add column if not exists suggested_questions jsonb not null default '[]'::jsonb;
alter table public.agents add column if not exists plan text not null default 'trial';

-- 3) Rich leads — everything the agent captures
alter table public.leads add column if not exists interest text;
alter table public.leads add column if not exists summary text;
alter table public.leads add column if not exists budget text;
alter table public.leads add column if not exists timeline text;
alter table public.leads add column if not exists location text;
alter table public.leads add column if not exists suggested_action text;
alter table public.leads add column if not exists source_page text;
alter table public.leads add column if not exists status text not null default 'new';
alter table public.leads add column if not exists updated_at timestamptz not null default now();

-- keep status values sane
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'leads_status_check') then
    alter table public.leads add constraint leads_status_check
      check (status in ('new','contacted','won','lost'));
  end if;
end $$;

-- 4) auto-touch updated_at on leads (reuses the existing trigger function)
drop trigger if exists leads_touch on public.leads;
create trigger leads_touch before update on public.leads
  for each row execute function public.touch_updated_at();

-- 5) helpful index for fetching a conversation's lead quickly
create index if not exists idx_leads_conversation on public.leads(conversation_id);