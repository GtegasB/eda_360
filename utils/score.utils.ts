import { EDAReport } from "../types";

export interface ScoreBreakdown {
  score100: number;
  maturityLevel: string;
  explanation: string;
  factors: Array<{ label: string; value: number; weight: number }>;
}

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

const maturity = (score: number) => {
  if (score <= 20) return "Presença digital frágil";
  if (score <= 40) return "Presença digital básica";
  if (score <= 60) return "Estrutura digital inicial";
  if (score <= 80) return "Estrutura digital em desenvolvimento";
  return "E.D.A. avançada";
};

export const computeScoreBreakdown = (report: EDAReport): ScoreBreakdown => {
  const channels = report.canais || [];
  const found = channels.filter((c) => c.encontrado).length;
  const active = channels.filter((c) => c.encontrado && c.ativo).length;
  const official = channels.filter((c) => c.pareceOficial).length;
  const total = Math.max(channels.length, 1);

  const evidenceConfidence = report.confidenceScore ?? 50;
  const opportunities = (report.oportunidades || []).length;

  const factors = [
    { label: "Presença digital", value: (found / total) * 100, weight: 15 },
    { label: "Clareza de canais", value: (official / total) * 100, weight: 10 },
    { label: "Conexão entre canais", value: (active / total) * 100, weight: 15 },
    { label: "Captação", value: clamp((report.notaGeralEDA || 0) * 10 - 10), weight: 10 },
    { label: "Conversão", value: clamp((report.notaGeralEDA || 0) * 10), weight: 10 },
    { label: "Autoridade", value: clamp((report.notaGeralEDA || 0) * 10 + 5), weight: 10 },
    { label: "Atendimento", value: clamp((active / total) * 100), weight: 10 },
    { label: "Proteção digital", value: clamp((report.notaGeralEDA || 0) * 10), weight: 10 },
    { label: "Evidências", value: clamp(evidenceConfidence), weight: 5 },
    { label: "Oportunidades mapeadas", value: clamp(100 - opportunities * 8, 20, 100), weight: 5 },
  ];

  const weighted = factors.reduce((acc, f) => acc + f.value * (f.weight / 100), 0);
  const score100 = clamp(Math.round(weighted));

  const weak = factors.filter((f) => f.value < 55).map((f) => f.label.toLowerCase());
  const explanation =
    weak.length > 0
      ? `Seu score foi impactado por ${weak.slice(0, 3).join(", ")} e precisa de evolução estruturada.`
      : "Seu score indica boa base digital, com espaço para fortalecer conexão e conversão.";

  return {
    score100,
    maturityLevel: maturity(score100),
    explanation,
    factors,
  };
};

