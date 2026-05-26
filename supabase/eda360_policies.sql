-- Sistema: Eda 360
-- Uso temporário: Supabase compartilhado do SagB
-- Objetivo: isolamento por prefixo eda360_ para futura extração/migração

alter table public.eda360_diagnostics enable row level security;
alter table public.eda360_leads enable row level security;
alter table public.eda360_diagnostic_events enable row level security;
alter table public.eda360_audit_logs enable row level security;

drop policy if exists eda360_policy_select_diagnostics on public.eda360_diagnostics;
create policy eda360_policy_select_diagnostics
on public.eda360_diagnostics
for select
to anon, authenticated
using (true);

drop policy if exists eda360_policy_insert_diagnostics on public.eda360_diagnostics;
create policy eda360_policy_insert_diagnostics
on public.eda360_diagnostics
for insert
to anon, authenticated
with check (true);

drop policy if exists eda360_policy_insert_leads on public.eda360_leads;
create policy eda360_policy_insert_leads
on public.eda360_leads
for insert
to anon, authenticated
with check (true);

drop policy if exists eda360_policy_insert_events on public.eda360_diagnostic_events;
create policy eda360_policy_insert_events
on public.eda360_diagnostic_events
for insert
to anon, authenticated
with check (true);

drop policy if exists eda360_policy_select_leads on public.eda360_leads;
create policy eda360_policy_select_leads
on public.eda360_leads
for select
to authenticated
using (true);

