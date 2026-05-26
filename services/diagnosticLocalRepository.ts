import { EDAReport } from "../types";
import { DiagnosticRepository, StoredDiagnostic } from "./diagnostic.types";

const STORAGE_KEY = "eda360.diagnostics.v1";

const isBrowser = () => typeof window !== "undefined";

const getMaturityLevel = (score100: number) => {
  if (score100 <= 20) return "Presença digital frágil";
  if (score100 <= 40) return "Presença digital básica";
  if (score100 <= 60) return "Estrutura digital inicial";
  if (score100 <= 80) return "Estrutura digital em desenvolvimento";
  return "E.D.A. avançada";
};

const score10To100 = (score10: number) => Math.max(0, Math.min(100, Math.round(score10 * 10)));

export const diagnosticLocalRepository: DiagnosticRepository = {
  async save(report: EDAReport): Promise<StoredDiagnostic> {
    const score100 = score10To100(report.notaGeralEDA || 0);
    const item: StoredDiagnostic = {
      id: report.analysisId || crypto.randomUUID(),
      createdAt: report.dataGeracao || new Date().toISOString(),
      companyName: report.empresaPrincipal?.nome || "Empresa",
      score: score100,
      maturityLevel: getMaturityLevel(score100),
      status: report.analysisStatus || "completed",
      source: report.analysisSource || "unknown",
      initialChannel: undefined,
      storage: "local",
      report,
    };

    if (!isBrowser()) return item;
    const current = await this.list();
    const next = [item, ...current].slice(0, 300);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return item;
  },

  async list(): Promise<StoredDiagnostic[]> {
    if (!isBrowser()) return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw) as StoredDiagnostic[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },
};

