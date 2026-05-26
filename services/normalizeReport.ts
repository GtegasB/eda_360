import { EDA_PILLARS, EDAReport, PillarAction } from "../types";
import { reportInputSchema, ReportInput } from "./reportSchema";

const clampScore = (value: unknown): number => {
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

export const normalizeReport = (raw: unknown, fallbackIdentifier: string): EDAReport => {
  const parsed = reportInputSchema.safeParse(raw);
  const safeRaw: ReportInput = parsed.success ? parsed.data : {};

  const empresaPrincipal = {
    nome: safeRaw.empresaPrincipal?.nome || safeRaw.dadosIdentificados?.nome || fallbackIdentifier,
    cidade: safeRaw.empresaPrincipal?.cidade || safeRaw.dadosIdentificados?.cidade || "Nacional",
    segmento:
      safeRaw.empresaPrincipal?.segmento || safeRaw.dadosIdentificados?.segmento || "Nao identificado"
  };

  const entidadesComplementares = Array.isArray(safeRaw.entidadesComplementares)
    ? safeRaw.entidadesComplementares.slice(0, 3).map((ent, idx: number) => ({
        nome: ent?.nome || `Entidade Complementar ${idx + 1}`,
        cidade: ent?.cidade || "Nao identificado",
        segmento: ent?.segmento || "Nao identificado"
      }))
    : [];

  const channelsRaw = Array.isArray(safeRaw.canais) ? safeRaw.canais : [];
  const canais = channelsRaw.map((canal) => ({
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

  const evidenciasCanais: EDAReport["evidenciasCanais"] = canais.map((canal) => {
    const status: "encontrado" | "desconectado" | "ausente" = canal.encontrado
      ? canal.ativo
        ? "encontrado"
        : "desconectado"
      : "ausente";

    const origem: "inferido_ia" | "provavel" = canal.encontrado ? "inferido_ia" : "provavel";

    return {
      canal: canal.canal,
      tipo: canal.tipo,
      url: canal.url,
      status,
      forca: canal.encontrado && canal.ativo ? 8 : canal.encontrado ? 5 : 2,
      fragilidade: canal.encontrado ? (canal.ativo ? "Baixa" : "Canal sem atividade consistente") : "Canal não encontrado",
      evidencia: canal.observacoes || canal.ultimoSinal || "Sem evidência explícita",
      recomendacao: canal.encontrado
        ? canal.ativo
          ? "Fortalecer integração deste canal com o funil"
          : "Reativar canal e definir rotina de publicação"
        : "Criar presença oficial e conectar ao hub central",
      confianca: canal.pareceOficial ? 80 : canal.encontrado ? 60 : 35,
      origem
    };
  });

  const notasEDA = Array.isArray(safeRaw.notasEDA)
    ? safeRaw.notasEDA.map((item) => ({
        dimensao: item?.dimensao || "Dimensao",
        nota: clampScore(item?.nota),
        justificativa: item?.justificativa || ""
      }))
    : [];

  const rawPilares = Array.isArray(safeRaw.pilares) ? safeRaw.pilares : [];
  const pillarsByName = new Map<string, ReportInput["pilares"][number]>();
  rawPilares.forEach((item) => {
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
    criar: Array.isArray(safeRaw.leituraEstrutural?.criar) ? safeRaw.leituraEstrutural.criar : [],
    ajustar: Array.isArray(safeRaw.leituraEstrutural?.ajustar) ? safeRaw.leituraEstrutural.ajustar : [],
    fortalecer: Array.isArray(safeRaw.leituraEstrutural?.fortalecer)
      ? safeRaw.leituraEstrutural.fortalecer
      : []
  };

  const planoAcao = {
    criar: Array.isArray(safeRaw.planoAcao?.criar) ? safeRaw.planoAcao.criar : leituraEstrutural.criar,
    ajustar: Array.isArray(safeRaw.planoAcao?.ajustar)
      ? safeRaw.planoAcao.ajustar
      : leituraEstrutural.ajustar,
    fortalecer: Array.isArray(safeRaw.planoAcao?.fortalecer)
      ? safeRaw.planoAcao.fortalecer
      : leituraEstrutural.fortalecer
  };

  const notaDimensoes = notasEDA.length > 0
    ? Math.round(notasEDA.reduce((acc, cur) => acc + clampScore(cur.nota), 0) / notasEDA.length)
    : 0;

  const notaPilares = pilares.length > 0
    ? Math.round(pilares.reduce((acc, cur) => acc + clampScore(cur.nota), 0) / pilares.length)
    : 0;

  const notaGeralEDA = clampScore(safeRaw.notaGeralEDA || Math.round((notaDimensoes + notaPilares) / 2));
  const confidenceScore =
    evidenciasCanais.length > 0
      ? Math.round(evidenciasCanais.reduce((acc, cur) => acc + cur.confianca, 0) / evidenciasCanais.length)
      : 50;
  const riscos = [
    ...evidenciasCanais.filter((item) => item.status !== "encontrado").slice(0, 5).map((item) => `${item.canal}: ${item.fragilidade}`)
  ];
  const oportunidades = [
    ...evidenciasCanais.filter((item) => item.status === "encontrado").slice(0, 5).map((item) => `${item.canal}: ${item.recomendacao}`)
  ];

  return {
    identidadeProduto: {
      nomeInstitucional:
        safeRaw.identidadeProduto?.nomeInstitucional || "Centro de Inteligencia Digital",
      metodologia: safeRaw.identidadeProduto?.metodologia || "E.D.A - Estrutura Digital Avancada",
      aplicativo: safeRaw.identidadeProduto?.aplicativo || "EDA360",
      papelAplicativo:
        safeRaw.identidadeProduto?.papelAplicativo ||
        "Ferramenta gratuita de percepcao de valor e qualificacao inicial."
    },
    empresaPrincipal,
    entidadesComplementares,
    resumoExecutivo: safeRaw.resumoExecutivo || "Resumo nao informado pela IA.",
    ancoraOficial: safeRaw.ancoraOficial || empresaPrincipal.nome,
    notaGeralEDA,
    canais,
    notasEDA,
    pilares,
    leituraEstrutural,
    ecossistema: {
      entidades: Array.isArray(safeRaw.ecossistema?.entidades)
        ? safeRaw.ecossistema.entidades.map((entity, index) => ({
            id: entity.id || `entidade_${index + 1}`,
            nome: entity.nome || `Entidade ${index + 1}`,
            tipo: entity.tipo || "Complementar",
            papel: entity.papel || "Sem papel definido",
            statusConexao: entity.statusConexao || "Parcial",
            forcaDigital: clampScore(entity.forcaDigital),
          }))
        : [],
      conexoes: Array.isArray(safeRaw.ecossistema?.conexoes)
        ? safeRaw.ecossistema.conexoes.map((link) => ({
            de: link.de || "principal",
            para: link.para || "entidade_2",
            tipo: link.tipo || "Conexao digital",
            status: link.status || "Fraco",
            observacao: link.observacao || "Sem observacao",
          }))
        : [],
      leitura: safeRaw.ecossistema?.leitura || "Sem leitura detalhada do ecossistema."
    },
    planoAcao,
    recomendacaoComercial: {
      nivelProntidao: safeRaw.recomendacaoComercial?.nivelProntidao || "A diagnosticar",
      aberturaSessaoEstrategica:
        safeRaw.recomendacaoComercial?.aberturaSessaoEstrategica ||
        "Recomendado alinhar sessao estrategica.",
      proximoPasso:
        safeRaw.recomendacaoComercial?.proximoPasso ||
        "Consolidar prioridades da implementacao E.D.A."
    },
    analysisId: crypto.randomUUID(),
    analysisStatus: "completed",
    diagnosticVersion: "2026.05-mega-etapa-02",
    confidenceScore,
    evidenciasCanais,
    riscos,
    oportunidades,
    dataGeracao: safeRaw.dataGeracao || new Date().toISOString(),
    sources: []
  };
};

/** Extrai JSON do texto bruto ignorando markdown e ruído */
export const extractJson = (text: string): string => {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : text;
};

/** Concatena lista de entidades complementares para o prompt */
export const buildComplementaryBlock = (
  entities: Array<{ type?: string; name?: string; link?: string }>
): string => {
  const filtered = entities
    .filter((entity) => entity.name || entity.link)
    .slice(0, 3);

  if (filtered.length === 0) return "Nenhuma entidade complementar informada.";

  return filtered
    .map(
      (entity, index) =>
        `${index + 1}. Tipo: ${entity.type || "Nao informado"} | Nome: ${entity.name || "Nao informado"} | Link: ${entity.link || "Nao informado"}`
    )
    .join("\n");
};
