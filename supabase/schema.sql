-- EasyBuilda — Database Schema (v1). Run in Supabase → SQL Editor.
create extension if not exists "pgcrypto";

-- ===== PROFILES (extends auth.users) =====
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  plan text not null default 'trial' check (plan in ('trial','basic','pro','max','singularity')),
  role text not null default 'user' check (role in ('user','admin')),
  trial_started_at timestamptz not null default now(),
  trial_ends_at timestamptz not null default (now() + interval '3 days'),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== AGENTS (multi-tenant) =====
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  business_description text,
  tone text not null default 'friendly and professional',
  persona text,
  knowledge text,
  welcome_message text not null default 'Hi! How can I help you today?',
  primary_color text not null default '#7C3AED',
  avatar_url text,
  status text not null default 'active' check (status in ('active','paused')),
  show_branding boolean not null default true,
  subdomain text unique,
  custom_domain text,
  readiness_score int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists agents_touch on public.agents;
create trigger agents_touch before update on public.agents
  for each row execute function public.touch_updated_at();

-- ===== CONVERSATIONS / MESSAGES / LEADS =====
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  visitor_id text,
  page_url text,
  started_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  name text, email text, phone text,
  intent text check (intent in ('hot','warm','cold')),
  note text,
  created_at timestamptz not null default now()
);

-- ===== PAYMENTS (PayPal manual flow) =====
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan text not null check (plan in ('basic','pro','max','singularity')),
  amount numeric,
  payer_name text,
  paid_at text,
  screenshot_url text,
  status text not null default 'pending' check (status in ('pending','completed','rejected')),
  openrouter_key text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- ===== API KEYS (per-user, admin-managed) =====
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  openrouter_key text not null,
  monthly_limit numeric,
  created_at timestamptz not null default now()
);

-- ===== INDEXES =====
create index if not exists idx_agents_user on public.agents(user_id);
create index if not exists idx_conv_agent on public.conversations(agent_id);
create index if not exists idx_msg_conv on public.messages(conversation_id);
create index if not exists idx_leads_agent on public.leads(agent_id);
create index if not exists idx_payments_status on public.payments(status);
create index if not exists idx_keys_user on public.api_keys(user_id);

-- ===== ROW LEVEL SECURITY =====
alter table public.profiles enable row level security;
alter table public.agents enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.leads enable row level security;
alter table public.payments enable row level security;
alter table public.api_keys enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own agents" on public.agents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own conversations" on public.conversations
  for select using (exists (select 1 from public.agents a where a.id = agent_id and a.user_id = auth.uid()));
create policy "own messages" on public.messages
  for select using (exists (
    select 1 from public.conversations c
    join public.agents a on a.id = c.agent_id
    where c.id = conversation_id and a.user_id = auth.uid()));
create policy "own leads" on public.leads
  for select using (exists (select 1 from public.agents a where a.id = agent_id and a.user_id = auth.uid()));
create policy "own payments" on public.payments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own keys" on public.api_keys
  for select using (auth.uid() = user_id);
-- Backend uses the SERVICE ROLE key (bypasses RLS) for the public widget + admin actions.