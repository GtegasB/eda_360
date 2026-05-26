import { EDAReport } from "../types";

export interface StoredDiagnostic {
  id: string;
  createdAt: string;
  companyName: string;
  score: number;
  maturityLevel: string;
  status: string;
  source: string;
  initialChannel?: string;
  storage: "supabase" | "local";
  report: EDAReport;
}

export interface DiagnosticRepository {
  save(report: EDAReport): Promise<StoredDiagnostic>;
  list(): Promise<StoredDiagnostic[]>;
}

