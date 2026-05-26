import { EDAReport } from "../types";
import { DiagnosticRepository, StoredDiagnostic } from "./diagnostic.types";
import { hasSupabase, supabase } from "./supabaseClient";

const getMaturityLevel = (score100: number) => {
  if (score100 <= 20) return "Presença digital frágil";
  if (score100 <= 40) return "Presença digital básica";
  if (score100 <= 60) return "Estrutura digital inicial";
  if (score100 <= 80) return "Estrutura digital em desenvolvimento";
  return "E.D.A. avançada";
};

const score10To100 = (score10: number) => Math.max(0, Math.min(100, Math.round(score10 * 10)));

const mapReportToRow = (report: EDAReport) => {
  const score100 = score10To100(report.notaGeralEDA || 0);
  return {
    id: report.analysisId,
    company_name: report.empresaPrincipal?.nome || "Empresa",
    initial_input: report.empresaPrincipal?.nome || "",
    initial_channel_type: report.analysisSource || "desconhecido",
    website_url: report.canais.find((c) => c.tipo.toLowerCase().includes("site"))?.url || null,
    instagram_url: report.canais.find((c) => c.canal.toLowerCase().includes("instagram"))?.url || null,
    whatsapp: report.canais.find((c) => c.canal.toLowerCase().includes("whatsapp"))?.url || null,
    google_business_url: report.canais.find((c) => c.canal.toLowerCase().includes("google"))?.url || null,
    city: report.empresaPrincipal?.cidade || null,
    segment: report.empresaPrincipal?.segmento || null,
    score_general: score100,
    maturity_level: getMaturityLevel(score100),
    confidence_score: report.confidenceScore ?? 50,
    analysis_status: report.analysisStatus || "completed",
    analysis_source: report.analysisSource || "unknown",
    diagnostic_version: report.diagnosticVersion || "2026.05-mega-etapa-03",
    summary: {
      resumoExecutivo: report.resumoExecutivo,
      ancoraOficial: report.ancoraOficial,
    },
    channels: report.canais,
    evidences: report.evidenciasCanais || [],
    risks: report.riscos || [],
    opportunities: report.oportunidades || [],
    recommendations: report.planoAcao,
    commercial_cta: report.recomendacaoComercial,
    raw_input: {
      empresaPrincipal: report.empresaPrincipal,
      entidadesComplementares: report.entidadesComplementares,
    },
    raw_ai_response: {
      notasEDA: report.notasEDA,
      pilares: report.pilares,
      ecossistema: report.ecossistema,
    },
  };
};

export const diagnosticSupabaseRepository: DiagnosticRepository = {
  async save(report: EDAReport): Promise<StoredDiagnostic> {
    if (!hasSupabase || !supabase) throw new Error("SUPABASE_NOT_CONFIGURED");
    const row = mapReportToRow(report);

    const { error } = await supabase.from("eda360_diagnostics").upsert(row, { onConflict: "id" });
    if (error) throw error;

    const score = row.score_general;
    return {
      id: row.id || crypto.randomUUID(),
      createdAt: report.dataGeracao || new Date().toISOString(),
      companyName: row.company_name,
      score,
      maturityLevel: row.maturity_level,
      status: row.analysis_status,
      source: row.analysis_source,
      initialChannel: row.initial_channel_type,
      storage: "supabase",
      report,
    };
  },

  async list(): Promise<StoredDiagnostic[]> {
    if (!hasSupabase || !supabase) throw new Error("SUPABASE_NOT_CONFIGURED");
    const { data, error } = await supabase
      .from("eda360_diagnostics")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      createdAt: row.created_at,
      companyName: row.company_name,
      score: row.score_general,
      maturityLevel: row.maturity_level,
      status: row.analysis_status,
      source: row.analysis_source,
      initialChannel: row.initial_channel_type,
      storage: "supabase",
      report: {
        analysisId: row.id,
        analysisStatus: row.analysis_status,
        analysisSource: row.analysis_source,
        diagnosticVersion: row.diagnostic_version,
        confidenceScore: row.confidence_score,
        identidadeProduto: {
          nomeInstitucional: "Centro de Inteligencia Digital",
          metodologia: "E.D.A - Estrutura Digital Avancada",
          aplicativo: "EDA360",
          papelAplicativo: "Ferramenta de diagnostico inicial",
        },
        empresaPrincipal: {
          nome: row.company_name,
          cidade: row.city || "Nacional",
          segmento: row.segment || "Nao identificado",
        },
        entidadesComplementares: row.raw_input?.entidadesComplementares || [],
        resumoExecutivo: row.summary?.resumoExecutivo || "",
        ancoraOficial: row.summary?.ancoraOficial || row.company_name,
        notaGeralEDA: Math.round((row.score_general || 0) / 10),
        canais: row.channels || [],
        notasEDA: row.raw_ai_response?.notasEDA || [],
        pilares: row.raw_ai_response?.pilares || [],
        leituraEstrutural: row.recommendations || { criar: [], ajustar: [], fortalecer: [] },
        ecossistema: row.raw_ai_response?.ecossistema || { entidades: [], conexoes: [], leitura: "" },
        planoAcao: row.recommendations || { criar: [], ajustar: [], fortalecer: [] },
        recomendacaoComercial: row.commercial_cta || {
          nivelProntidao: "A diagnosticar",
          aberturaSessaoEstrategica: "",
          proximoPasso: "",
        },
        dataGeracao: row.created_at,
        sources: [],
        evidenciasCanais: row.evidences || [],
        riscos: row.risks || [],
        oportunidades: row.opportunities || [],
      },
    }));
  },
};

