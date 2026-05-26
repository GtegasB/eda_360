create extension if not exists "pgcrypto";

-- Sistema: Eda 360
-- Uso temporário: Supabase compartilhado do SagB
-- Objetivo: isolamento por prefixo eda360_ para futura extração/migração

create or replace function public.eda360_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.eda360_diagnostics (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  initial_input text,
  initial_channel_type text,
  website_url text,
  instagram_url text,
  whatsapp text,
  google_business_url text,
  city text,
  segment text,
  score_general integer,
  maturity_level text,
  confidence_score integer,
  analysis_status text default 'completed',
  analysis_source text,
  diagnostic_version text default 'v1',
  summary jsonb,
  channels jsonb,
  evidences jsonb,
  risks jsonb,
  opportunities jsonb,
  recommendations jsonb,
  commercial_cta jsonb,
  raw_input jsonb,
  raw_ai_response jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.eda360_diagnostics is 'Sistema: Eda 360. Diagnósticos da Estrutura Digital Avançada. Tabela isolada por prefixo para futura extração do Supabase compartilhado do SagB.';

create index if not exists idx_eda360_diagnostics_created_at on public.eda360_diagnostics(created_at desc);
create index if not exists idx_eda360_diagnostics_company_name on public.eda360_diagnostics(company_name);

drop trigger if exists trg_eda360_diagnostics_updated_at on public.eda360_diagnostics;
create trigger trg_eda360_diagnostics_updated_at
before update on public.eda360_diagnostics
for each row execute function public.eda360_set_updated_at();

create table if not exists public.eda360_leads (
  id uuid primary key default gen_random_uuid(),
  diagnostic_id uuid references public.eda360_diagnostics(id) on delete set null,
  company_name text not null,
  contact_name text,
  email text,
  phone text,
  preferred_channel text,
  cta_origin text,
  cta_label text,
  score_general integer,
  maturity_level text,
  status text default 'new',
  notes text,
  payload jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.eda360_leads is 'Sistema: Eda 360. Leads comerciais gerados a partir dos diagnósticos E.D.A. Tabela isolada por prefixo para futura extração do Supabase compartilhado do SagB.';

create index if not exists idx_eda360_leads_diagnostic_id on public.eda360_leads(diagnostic_id);
create index if not exists idx_eda360_leads_created_at on public.eda360_leads(created_at desc);

drop trigger if exists trg_eda360_leads_updated_at on public.eda360_leads;
create trigger trg_eda360_leads_updated_at
before update on public.eda360_leads
for each row execute function public.eda360_set_updated_at();

create table if not exists public.eda360_diagnostic_events (
  id uuid primary key default gen_random_uuid(),
  diagnostic_id uuid references public.eda360_diagnostics(id) on delete cascade,
  event_type text not null,
  event_label text,
  payload jsonb,
  created_at timestamptz default now()
);

comment on table public.eda360_diagnostic_events is 'Sistema: Eda 360. Eventos de uso e rastreabilidade dos diagnósticos. Prefixado para isolamento no Supabase compartilhado do SagB.';

create index if not exists idx_eda360_events_diagnostic_id on public.eda360_diagnostic_events(diagnostic_id);
create index if not exists idx_eda360_events_created_at on public.eda360_diagnostic_events(created_at desc);

create table if not exists public.eda360_audit_logs (
  id uuid primary key default gen_random_uuid(),
  scope text,
  action text,
  message text,
  severity text,
  diagnostic_id uuid,
  payload jsonb,
  created_at timestamptz default now()
);

comment on table public.eda360_audit_logs is 'Sistema: Eda 360. Logs técnicos e trilha de auditoria. Prefixado para isolamento no Supabase compartilhado do SagB.';

create index if not exists idx_eda360_audit_created_at on public.eda360_audit_logs(created_at desc);
