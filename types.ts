
export enum AppView {
  LANDING = 'LANDING',
  VITRINE = 'VITRINE',
  FORM = 'FORM',
  PROCESSING = 'PROCESSING',
  REPORT = 'REPORT',
  HISTORY = 'HISTORY'
}

export interface ComplementaryEntityInput {
  type: string;
  name: string;
  link: string;
}

export interface CompanyInput {
  identifier: string;
  initialChannel?: string;
  cityUF?: string;
  segment?: string;
  site?: string;
  strategicNote?: string;
  complementaryEntities: ComplementaryEntityInput[];
}

export type EvidenceOrigin = "informado" | "inferido_ia" | "provavel" | "confirmacao_manual";

export interface ChannelEvidence {
  canal: string;
  tipo: string;
  url?: string;
  status: "encontrado" | "ausente" | "desconectado";
  forca: number;
  fragilidade: string;
  evidencia: string;
  recomendacao: string;
  confianca: number;
  origem: EvidenceOrigin;
}

export interface ChannelData {
  tipo: string;
  canal: string;
  url: string;
  nomeExibido: string;
  encontrado: boolean;
  pareceOficial: boolean;
  ativo: boolean;
  ultimoSinal: string;
  observacoes: string;
}

export interface EDADimension {
  dimensao: string;
  nota: number;
  justificativa: string;
}

export interface ActionPlan {
  criar: string[];
  ajustar: string[];
  fortalecer: string[];
}

export const EDA_PILLARS = [
  "Identidade Institucional",
  "Site e Hub Central",
  "SEO e Encontrabilidade",
  "Google Business Profile",
  "Instagram",
  "Facebook",
  "LinkedIn",
  "YouTube",
  "WhatsApp Comercial",
  "Reputacao e Avaliacoes",
  "Conteudo e Autoridade",
  "Oferta e Posicionamento",
  "Funil e Conversao",
  "Automacoes e CRM",
  "Trafego Pago",
  "Dados e Mensuracao",
  "Governanca Digital",
  "Seguranca e Protecao",
  "Integracao Ecossistema"
] as const;

export type PillarAction = "Criar" | "Ajustar" | "Fortalecer";

export interface PillarAssessment {
  pilar: string;
  nota: number;
  acaoPrioritaria: PillarAction;
  justificativa: string;
  recomendacao: string;
}

export interface EcosystemEntity {
  id: string;
  nome: string;
  tipo: "Principal" | "Complementar";
  papel: string;
  statusConexao: "Conectada" | "Parcial" | "Isolada";
  forcaDigital: number;
}

export interface EcosystemLink {
  de: string;
  para: string;
  tipo: string;
  status: "Ativo" | "Fraco" | "Ausente";
  observacao: string;
}

export interface EcosystemMap {
  entidades: EcosystemEntity[];
  conexoes: EcosystemLink[];
  leitura: string;
}

export interface IdentifiedCompany {
  nome: string;
  cidade: string;
  segmento: string;
}

export interface EDAReport {
  analysisId?: string;
  analysisStatus?: "completed" | "partial" | "error";
  analysisSource?: "deepseek" | "gemini" | "fallback";
  diagnosticVersion?: string;
  confidenceScore?: number;
  identidadeProduto: {
    nomeInstitucional: string;
    metodologia: string;
    aplicativo: string;
    papelAplicativo: string;
  };
  empresaPrincipal: IdentifiedCompany;
  entidadesComplementares: IdentifiedCompany[];
  resumoExecutivo: string;
  ancoraOficial: string;
  notaGeralEDA: number;
  canais: ChannelData[];
  notasEDA: EDADimension[];
  pilares: PillarAssessment[];
  leituraEstrutural: {
    criar: string[];
    ajustar: string[];
    fortalecer: string[];
  };
  ecossistema: EcosystemMap;
  planoAcao: ActionPlan;
  recomendacaoComercial: {
    nivelProntidao: string;
    aberturaSessaoEstrategica: string;
    proximoPasso: string;
  };
  dataGeracao: string;
  sources?: { title: string; uri: string }[];
  evidenciasCanais?: ChannelEvidence[];
  riscos?: string[];
  oportunidades?: string[];
}
