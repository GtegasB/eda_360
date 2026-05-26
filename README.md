# EDA360 - Estrutura EDA

EDA360 e o aplicativo gratuito de analise do **Centro de Inteligencia Digital**.
Ele funciona como porta de entrada para a metodologia **E.D.A (Estrutura Digital Avancada)**.

## Hierarquia do Projeto

1. **Centro de Inteligencia Digital** (nome institucional e guarda-chuva)
2. **E.D.A - Estrutura Digital Avancada** (metodologia proprietaria)
3. **EDA360** (aplicativo de analise inicial e qualificacao)

## Objetivo do EDA360

O EDA360 nao substitui a metodologia completa.
Ele faz uma leitura inicial para identificar:

- o que ja existe
- o que esta fraco
- o que esta ausente
- o que precisa ser criado
- como os canais e entidades estao (ou nao) conectados

Com isso, o app apoia:

- atracao de leads
- trafego pago
- qualificacao inicial
- apoio comercial
- abertura para sessao estrategica
- preparacao para implantacao futura da E.D.A

## Capacidades da Versao Atual

- Analise de empresa principal + ate 3 entidades complementares
- Nota geral E.D.A (0-10)
- Avaliacao por dimensoes E.D.A
- Diagnostico por 19 pilares da metodologia
- Leitura de prioridades: **Criar, Ajustar, Fortalecer**
- Mapa do ecossistema digital (entidades e conexoes)
- Plano de acao orientado para evolucao estrutural

## Run Locally

**Prerequisites:** Node.js

1. Instale as dependencias:
   `npm install`
2. Defina as chaves de API em `.env`:
   - `DEEPSEEK_API_KEY` — motor principal da varredura
   - `GEMINI_API_KEY` — fallback com Google Search grounding
3. Rode a aplicacao:
   `npm run dev`

## Arquitetura dos Motores de IA

A varredura EDA360 usa dois motores em cascata:

1. **DeepSeek** (primário) — [`services/deepseekService.ts`](services/deepseekService.ts)
   - API compatível com OpenAI em `https://api.deepseek.com/v1/chat/completions`
   - Modelo: `deepseek-chat`
   - Retorno em `response_format: { type: "json_object" }`

2. **Gemini** (fallback) — [`services/geminiService.ts`](services/geminiService.ts)
   - Usado quando DeepSeek falha
   - Modelo: `gemini-3-pro-preview`
   - Conta com Google Search grounding para validação de dados reais

O orquestrador está em [`services/analyzeService.ts`](services/analyzeService.ts). O utilitário de normalização comum está em [`services/normalizeReport.ts`](services/normalizeReport.ts).
