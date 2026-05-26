# EDA360 — MEGA-ETAPA 03

## Entregas implementadas

- Persistência preparada para Supabase + fallback local via repository provider.
- Estrutura SQL criada em [`supabase/eda360_schema.sql`](../supabase/eda360_schema.sql).
- Score 0-100 explicável implementado em [`utils/score.utils.ts`](../utils/score.utils.ts).
- Histórico evoluído para exibir origem e maturidade.
- CTA comercial funcional com registro local inicial em [`services/leadRepository.ts`](../services/leadRepository.ts).

## Variáveis de ambiente esperadas

- `DEEPSEEK_API_KEY` (Netlify Function)
- `GEMINI_API_KEY` (Netlify Function)
- `VITE_SUPABASE_URL` (frontend)
- `VITE_SUPABASE_ANON_KEY` (frontend)

## Arquitetura de persistência

- [`services/diagnosticRepositoryProvider.ts`](../services/diagnosticRepositoryProvider.ts)
  - tenta Supabase quando configurado
  - fallback automático para localStorage

## Pendências recomendadas

- Criar endpoint real de lead em backend (ou função Netlify dedicada).
- Aplicar RLS no Supabase e políticas de acesso.
- Extrair telas para módulos/páginas dedicadas para reduzir tamanho de [`App.tsx`](../App.tsx).

