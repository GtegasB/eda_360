import { CompanyInput, EDA_PILLARS, EDAReport } from "../types";
import { normalizeReport, extractJson, buildComplementaryBlock } from "./normalizeReport";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

const SYSTEM_PROMPT = `Você é o Motor de Inteligência EDA360 do Centro de Inteligência Digital (GrupoB).

HIERARQUIA DO PRODUTO:
1) Centro de Inteligência Digital (institucional guarda-chuva)
2) E.D.A - Estrutura Digital Avançada (metodologia)
3) EDA360 (aplicativo gratuito de análise, porta de entrada da metodologia)

Você recebe dados de uma empresa e analisa sua maturidade digital com base nos 19 pilares da E.D.A.
Sempre retorne EXCLUSIVAMENTE JSON válido, sem markdown, sem blocos de código, sem texto fora do JSON.`;

const buildUserPrompt = (input: CompanyInput): string => {
  const complementaryBlock = buildComplementaryBlock(input.complementaryEntities);

  return `
ENTRADA PRINCIPAL: "${input.identifier}"
CONTEXTO INFORMADO:
- Cidade/UF: "${input.cityUF || "Nao informado"}"
- Segmento: "${input.segment || "Nao informado"}"
- Site principal: "${input.site || "Nao informado"}"
- Observacao estrategica: "${input.strategicNote || "Nao informado"}"

ENTIDADES COMPLEMENTARES (até 3):
${complementaryBlock}

INSTRUÇÕES:
- Analise empresa principal e relacione entidades complementares ao ecossistema digital.
- Avalie os 19 pilares da E.D.A com nota de 0 a 10 e ação prioritária (Criar, Ajustar ou Fortalecer).
- Gere uma nota geral E.D.A de 0 a 10.
- Traga leitura de ecossistema (entidades, conexões, fragilidades e ausências).

PILARES OBRIGATÓRIOS:
${EDA_PILLARS.map((pillar, idx) => `${idx + 1}. ${pillar}`).join("\n")}

RETORNE EXCLUSIVAMENTE JSON (sem markdown, sem texto fora do JSON) no formato:
{
  "identidadeProduto": {
    "nomeInstitucional": "Centro de Inteligencia Digital",
    "metodologia": "E.D.A - Estrutura Digital Avancada",
    "aplicativo": "EDA360",
    "papelAplicativo": "string"
  },
  "empresaPrincipal": { "nome": "string", "cidade": "string", "segmento": "string" },
  "entidadesComplementares": [
    { "nome": "string", "cidade": "string", "segmento": "string" }
  ],
  "resumoExecutivo": "string",
  "ancoraOficial": "string",
  "notaGeralEDA": 0,
  "canais": [
    {
      "tipo": "Site|Rede Social|Marketplace|Canal Direto|Midia",
      "canal": "Instagram",
      "url": "string",
      "nomeExibido": "string",
      "encontrado": true,
      "pareceOficial": true,
      "ativo": true,
      "ultimoSinal": "string",
      "observacoes": "string"
    }
  ],
  "notasEDA": [
    { "dimensao": "Estrutura", "nota": 0, "justificativa": "string" },
    { "dimensao": "Conexao", "nota": 0, "justificativa": "string" },
    { "dimensao": "Conversao", "nota": 0, "justificativa": "string" },
    { "dimensao": "Governanca", "nota": 0, "justificativa": "string" }
  ],
  "pilares": [
    {
      "pilar": "Identidade Institucional",
      "nota": 0,
      "acaoPrioritaria": "Criar",
      "justificativa": "string",
      "recomendacao": "string"
    }
  ],
  "leituraEstrutural": {
    "criar": ["string"],
    "ajustar": ["string"],
    "fortalecer": ["string"]
  },
  "ecossistema": {
    "entidades": [
      {
        "id": "principal",
        "nome": "string",
        "tipo": "Principal|Complementar",
        "papel": "string",
        "statusConexao": "Conectada|Parcial|Isolada",
        "forcaDigital": 0
      }
    ],
    "conexoes": [
      {
        "de": "principal",
        "para": "entidade_2",
        "tipo": "Site para WhatsApp",
        "status": "Ativo|Fraco|Ausente",
        "observacao": "string"
      }
    ],
    "leitura": "string"
  },
  "planoAcao": {
    "criar": ["string"],
    "ajustar": ["string"],
    "fortalecer": ["string"]
  },
  "recomendacaoComercial": {
    "nivelProntidao": "Baixa|Media|Alta",
    "aberturaSessaoEstrategica": "string",
    "proximoPasso": "string"
  },
  "dataGeracao": "string ISO"
}`;
};

export const analyzeWithDeepSeek = async (input: CompanyInput): Promise<EDAReport> => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY não configurada");

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(input) }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    throw new Error(`DeepSeek API error ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  const content: string = data.choices?.[0]?.message?.content;

  if (!content) throw new Error("DeepSeek retornou resposta vazia");

  const cleanJson = extractJson(content);
  const raw = JSON.parse(cleanJson);
  const report = normalizeReport(raw, input.identifier);
  report.dataGeracao = new Date().toISOString();

  return report;
};
