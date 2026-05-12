
import { GoogleGenAI } from "@google/genai";
import { CompanyInput, EDA_PILLARS, EDAReport, PillarAction } from "../types";

const clampScore = (value: unknown) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return 0;
  return Math.max(0, Math.min(10, Math.round(numeric)));
};

const normalizeAction = (value: unknown): PillarAction => {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("fortal")) return "Fortalecer";
  if (normalized.includes("ajust")) return "Ajustar";
  return "Criar";
};

const normalizeReport = (raw: any, fallbackIdentifier: string): EDAReport => {
  const empresaPrincipal = {
    nome: raw?.empresaPrincipal?.nome || raw?.dadosIdentificados?.nome || fallbackIdentifier,
    cidade: raw?.empresaPrincipal?.cidade || raw?.dadosIdentificados?.cidade || "Nacional",
    segmento: raw?.empresaPrincipal?.segmento || raw?.dadosIdentificados?.segmento || "Nao identificado"
  };

  const entidadesComplementares = Array.isArray(raw?.entidadesComplementares)
    ? raw.entidadesComplementares.slice(0, 3).map((ent: any, idx: number) => ({
        nome: ent?.nome || `Entidade Complementar ${idx + 1}`,
        cidade: ent?.cidade || "Nao identificado",
        segmento: ent?.segmento || "Nao identificado"
      }))
    : [];

  const channelsRaw = Array.isArray(raw?.canais) ? raw.canais : [];
  const canais = channelsRaw.map((canal: any) => ({
    tipo: canal?.tipo || "Canal",
    canal: canal?.canal || "Canal",
    url: canal?.url || "",
    nomeExibido: canal?.nomeExibido || "",
    encontrado: Boolean(canal?.encontrado),
    pareceOficial: Boolean(canal?.pareceOficial),
    ativo: Boolean(canal?.ativo),
    ultimoSinal: canal?.ultimoSinal || "Nao identificado",
    observacoes: canal?.observacoes || ""
  }));

  const notasEDA = Array.isArray(raw?.notasEDA)
    ? raw.notasEDA.map((item: any) => ({
        dimensao: item?.dimensao || "Dimensao",
        nota: clampScore(item?.nota),
        justificativa: item?.justificativa || ""
      }))
    : [];

  const rawPilares = Array.isArray(raw?.pilares) ? raw.pilares : [];
  const pillarsByName = new Map<string, any>();
  rawPilares.forEach((item: any) => {
    if (item?.pilar) pillarsByName.set(String(item.pilar), item);
  });

  const pilares = EDA_PILLARS.map((pilarNome) => {
    const pillar = pillarsByName.get(pilarNome) || {};
    return {
      pilar: pilarNome,
      nota: clampScore(pillar?.nota),
      acaoPrioritaria: normalizeAction(pillar?.acaoPrioritaria),
      justificativa: pillar?.justificativa || "Sem justificativa especifica.",
      recomendacao: pillar?.recomendacao || "Revisar este pilar no plano de acao."
    };
  });

  const leituraEstrutural = {
    criar: Array.isArray(raw?.leituraEstrutural?.criar) ? raw.leituraEstrutural.criar : [],
    ajustar: Array.isArray(raw?.leituraEstrutural?.ajustar) ? raw.leituraEstrutural.ajustar : [],
    fortalecer: Array.isArray(raw?.leituraEstrutural?.fortalecer) ? raw.leituraEstrutural.fortalecer : []
  };

  const planoAcao = {
    criar: Array.isArray(raw?.planoAcao?.criar) ? raw.planoAcao.criar : leituraEstrutural.criar,
    ajustar: Array.isArray(raw?.planoAcao?.ajustar) ? raw.planoAcao.ajustar : leituraEstrutural.ajustar,
    fortalecer: Array.isArray(raw?.planoAcao?.fortalecer) ? raw.planoAcao.fortalecer : leituraEstrutural.fortalecer
  };

  const notaDimensoes = notasEDA.length > 0
    ? Math.round(notasEDA.reduce((acc, cur) => acc + clampScore(cur.nota), 0) / notasEDA.length)
    : 0;

  const notaPilares = pilares.length > 0
    ? Math.round(pilares.reduce((acc, cur) => acc + clampScore(cur.nota), 0) / pilares.length)
    : 0;

  const notaGeralEDA = clampScore(raw?.notaGeralEDA || Math.round((notaDimensoes + notaPilares) / 2));

  return {
    identidadeProduto: {
      nomeInstitucional: raw?.identidadeProduto?.nomeInstitucional || "Centro de Inteligencia Digital",
      metodologia: raw?.identidadeProduto?.metodologia || "E.D.A - Estrutura Digital Avancada",
      aplicativo: raw?.identidadeProduto?.aplicativo || "EDA360",
      papelAplicativo: raw?.identidadeProduto?.papelAplicativo || "Ferramenta gratuita de percepcao de valor e qualificacao inicial."
    },
    empresaPrincipal,
    entidadesComplementares,
    resumoExecutivo: raw?.resumoExecutivo || "Resumo nao informado pela IA.",
    ancoraOficial: raw?.ancoraOficial || empresaPrincipal.nome,
    notaGeralEDA,
    canais,
    notasEDA,
    pilares,
    leituraEstrutural,
    ecossistema: {
      entidades: Array.isArray(raw?.ecossistema?.entidades) ? raw.ecossistema.entidades : [],
      conexoes: Array.isArray(raw?.ecossistema?.conexoes) ? raw.ecossistema.conexoes : [],
      leitura: raw?.ecossistema?.leitura || "Sem leitura detalhada do ecossistema."
    },
    planoAcao,
    recomendacaoComercial: {
      nivelProntidao: raw?.recomendacaoComercial?.nivelProntidao || "A diagnosticar",
      aberturaSessaoEstrategica: raw?.recomendacaoComercial?.aberturaSessaoEstrategica || "Recomendado alinhar sessao estrategica.",
      proximoPasso: raw?.recomendacaoComercial?.proximoPasso || "Consolidar prioridades da implementacao E.D.A."
    },
    dataGeracao: raw?.dataGeracao || new Date().toISOString(),
    sources: []
  };
};

export const analyzeCompany = async (input: CompanyInput): Promise<EDAReport> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");

  // Create a new instance right before making an API call to ensure it uses the most up-to-date API key
  const ai = new GoogleGenAI({ apiKey });

  const complementary = input.complementaryEntities
    .filter((entity) => entity.name || entity.link)
    .slice(0, 3);

  const complementaryBlock = complementary.length > 0
    ? complementary
        .map(
          (entity, index) =>
            `${index + 1}. Tipo: ${entity.type || "Nao informado"} | Nome: ${entity.name || "Nao informado"} | Link: ${entity.link || "Nao informado"}`
        )
        .join("\n")
    : "Nenhuma entidade complementar informada.";

  const prompt = `
Você é o Motor de Inteligência EDA360 do Centro de Inteligência Digital (GrupoB).

HIERARQUIA DO PRODUTO:
1) Centro de Inteligência Digital (institucional guarda-chuva)
2) E.D.A - Estrutura Digital Avançada (metodologia)
3) EDA360 (aplicativo gratuito de análise, porta de entrada da metodologia)

ENTRADA PRINCIPAL: "${input.identifier}"
CONTEXTO INFORMADO:
- Cidade/UF: "${input.cityUF || "Nao informado"}"
- Segmento: "${input.segment || "Nao informado"}"
- Site principal: "${input.site || "Nao informado"}"
- Observacao estrategica: "${input.strategicNote || "Nao informado"}"

ENTIDADES COMPLEMENTARES (até 3):
${complementaryBlock}

INSTRUÇÕES:
- Use Google Search para validar dados reais e sinais digitais.
- Entenda o EDA360 como ferramenta de percepção de valor, qualificação inicial e abertura para sessão estratégica.
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

  try {
    // Upgrade to gemini-3-pro-preview for complex reasoning and analysis tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
      }
    });

    // Access .text property directly (not a method)
    const text = response.text;
    if (!text) throw new Error("IA retornou resposta vazia");

    // Extract grounding chunks as required by the Google Search grounding guidelines
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web)
      ?.filter(Boolean)
      ?.map((web: any) => ({
        title: web.title,
        uri: web.uri
      })) || [];

    // Rigorous cleaning to ensure only the JSON is processed
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const cleanJson = jsonMatch ? jsonMatch[0] : text;
    
    const raw = JSON.parse(cleanJson);
    const report = normalizeReport(raw, input.identifier);
    report.sources = sources;
    return report;
  } catch (error: any) {
    console.error("Erro na análise:", error);
    
    // Handle "Requested entity was not found" error by indicating API key issues
    const errorMessage = error.message || error.toString() || "";
    if (errorMessage.toLowerCase().includes("404") || errorMessage.toLowerCase().includes("not found")) {
        throw new Error("API_KEY_RESOURCE_NOT_FOUND");
    }
    
    throw error;
  }
};
