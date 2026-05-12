import { PillarAssessment } from "../types";

export type PillarStatus = "forte" | "parcial" | "ausente";

export interface PillarRow {
  pilar: string;
  nota: number;
  acao: string;
  status: PillarStatus;
  statusLabel: string;
  relation: string;
  leitura: string;
}

const PILLAR_RELATIONS: Record<string, string> = {
  "Identidade Institucional": "Site e Hub Central, Conteudo e Autoridade",
  "Site e Hub Central": "SEO e Encontrabilidade, Funil e Conversao",
  "SEO e Encontrabilidade": "Google Business Profile, Site e Hub Central",
  "Google Business Profile": "Reputacao e Avaliacoes, WhatsApp Comercial",
  "Instagram": "WhatsApp Comercial, Oferta e Posicionamento",
  "Facebook": "Instagram, Trafego Pago",
  "LinkedIn": "Conteudo e Autoridade, Oferta e Posicionamento",
  "YouTube": "Conteudo e Autoridade, SEO e Encontrabilidade",
  "WhatsApp Comercial": "Funil e Conversao, Automacoes e CRM",
  "Reputacao e Avaliacoes": "Google Business Profile, Governanca Digital",
  "Conteudo e Autoridade": "LinkedIn, YouTube",
  "Oferta e Posicionamento": "Funil e Conversao, Trafego Pago",
  "Funil e Conversao": "Site e Hub Central, Automacoes e CRM",
  "Automacoes e CRM": "Dados e Mensuracao, Governanca Digital",
  "Trafego Pago": "Dados e Mensuracao, Oferta e Posicionamento",
  "Dados e Mensuracao": "Automacoes e CRM, Governanca Digital",
  "Governanca Digital": "Seguranca e Protecao, Integracao Ecossistema",
  "Seguranca e Protecao": "Governanca Digital, Site e Hub Central",
  "Integracao Ecossistema": "Dados e Mensuracao, Funil e Conversao"
};

export const RADAR_EDGES: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 8], [4, 8], [4, 11], [5, 14], [6, 10], [7, 10],
  [8, 12], [12, 13], [13, 15], [15, 16], [16, 17], [16, 18], [11, 12], [14, 15]
];

export const statusFromScore = (score: number): PillarStatus => {
  if (score >= 8) return "forte";
  if (score >= 5) return "parcial";
  return "ausente";
};

const statusLabel = (status: PillarStatus) => {
  if (status === "forte") return "Forte";
  if (status === "parcial") return "Parcial";
  return "Ausente";
};

const leitura = (pilar: string, status: PillarStatus) => {
  if (status === "forte") return `${pilar} ja existe e deve ser fortalecido no ecossistema.`;
  if (status === "parcial") return `${pilar} existe, mas precisa de ajuste para gerar mais resultado.`;
  return `${pilar} aparece como ausente e demanda criacao estruturada.`;
};

export const derivePillarRows = (pilares: PillarAssessment[]): PillarRow[] =>
  pilares.map((item) => {
    const status = statusFromScore(item.nota);
    return {
      pilar: item.pilar,
      nota: item.nota,
      acao: item.acaoPrioritaria,
      status,
      statusLabel: statusLabel(status),
      relation: PILLAR_RELATIONS[item.pilar] || "Sem ligacao principal definida.",
      leitura: leitura(item.pilar, status)
    };
  });

