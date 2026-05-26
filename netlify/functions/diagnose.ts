import type { Handler } from "@netlify/functions";
import { GoogleGenAI, GroundingChunk } from "@google/genai";
import { z } from "zod";
import { EDA_PILLARS } from "../../types";
import { normalizeReport, extractJson, buildComplementaryBlock } from "../../services/normalizeReport";

const inputSchema = z.object({
  identifier: z.string().min(1),
  initialChannel: z.string().optional(),
  cityUF: z.string().optional(),
  segment: z.string().optional(),
  site: z.string().optional(),
  strategicNote: z.string().optional(),
  complementaryEntities: z
    .array(
      z.object({
        type: z.string().optional(),
        name: z.string().optional(),
        link: z.string().optional(),
      })
    )
    .default([]),
});

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

const buildPrompt = (input: z.infer<typeof inputSchema>) => {
  const complementaryBlock = buildComplementaryBlock(input.complementaryEntities);
  return `
CONTEXTO DO PRODUTO:
- Você está gerando um PRÉ-DIAGNÓSTICO comercial da Estrutura Digital (E.D.A.), não uma consultoria completa.
- Objetivo: gerar consciência de gaps e orientar próximo passo consultivo com a 3forB.

REGRAS DE RESPOSTA:
- Linguagem consultiva e objetiva.
- Tratar achados como "sinais identificados", "pontos de atenção" e "gaps".
- Evitar plano detalhado de execução, passo a passo operacional, playbook completo ou solução pronta.
- Sugerir impactos comerciais de forma geral (ex: perda de confiança, menor conversão, baixa encontrabilidade).
- Manter as recomendações em nível estratégico e inicial.
- Deixar claro que é uma leitura inicial.
- Não afirmar dados internos da empresa sem evidência pública.
- Limitar recomendações profundas e operacionais.

ENTRADA PRINCIPAL: "${input.identifier}"
CANAL INICIAL: "${input.initialChannel || "Nao informado"}"
CONTEXTO INFORMADO:
- Cidade/UF: "${input.cityUF || "Nao informado"}"
- Segmento: "${input.segment || "Nao informado"}"
- Site principal: "${input.site || "Nao informado"}"
- Observacao estrategica: "${input.strategicNote || "Nao informado"}"

ENTIDADES COMPLEMENTARES (até 3):
${complementaryBlock}

PILARES OBRIGATÓRIOS:
${EDA_PILLARS.map((pillar, idx) => `${idx + 1}. ${pillar}`).join("\n")}

FORMATO ESPERADO:
- incluir nota geral E.D.A (0 a 10), nível de maturidade, leitura inicial, principais gaps, possíveis impactos e próximo passo consultivo.
- Não entregar roteiro completo de implementação.
- Priorizar resposta útil para relatório público enxuto.

RETORNE EXCLUSIVAMENTE JSON.`;
};

const analyzeWithDeepSeek = async (input: z.infer<typeof inputSchema>) => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY_MISSING");

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "Retorne apenas JSON válido." },
        { role: "user", content: buildPrompt(input) },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    throw new Error(`DEEPSEEK_ERROR_${response.status}:${errBody}`);
  }

  const data = await response.json();
  const content: string = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("DEEPSEEK_EMPTY");

  const raw = JSON.parse(extractJson(content));
  const report = normalizeReport(raw, input.identifier);
  report.analysisSource = "deepseek";
  report.analysisStatus = "completed";
  report.dataGeracao = new Date().toISOString();
  return report;
};

const analyzeWithGemini = async (input: z.infer<typeof inputSchema>) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY_MISSING");

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: buildPrompt(input),
    config: { tools: [{ googleSearch: {} }], temperature: 0.2 },
  });

  const text = response.text;
  if (!text) throw new Error("GEMINI_EMPTY");

  const sources =
    response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: GroundingChunk) => chunk.web)
      ?.filter((web): web is { title: string; uri: string } => Boolean(web?.title && web?.uri))
      ?.map((web) => ({ title: web.title, uri: web.uri })) || [];

  const raw = JSON.parse(extractJson(text));
  const report = normalizeReport(raw, input.identifier);
  report.sources = sources;
  report.analysisSource = "gemini";
  report.analysisStatus = "completed";
  report.dataGeracao = new Date().toISOString();
  return report;
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const parsed = inputSchema.parse(body);

    try {
      const report = await analyzeWithDeepSeek(parsed);
      return { statusCode: 200, body: JSON.stringify(report) };
    } catch (deepseekError) {
      console.warn("DeepSeek failed, using Gemini fallback", deepseekError);
    }

    const fallbackReport = await analyzeWithGemini(parsed);
    fallbackReport.analysisSource = "fallback";
    return { statusCode: 200, body: JSON.stringify(fallbackReport) };
  } catch (error) {
    console.error("diagnose function failed", error);
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    return { statusCode: 500, body: JSON.stringify({ error: message }) };
  }
};
