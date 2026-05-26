export interface CommercialLeadPayload {
  diagnosticId?: string;
  companyName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  preferredChannel?: string;
  ctaOrigin: string;
  ctaLabel?: string;
  scoreGeneral?: number;
  maturityLevel?: string;
  interest?: string;
  notes?: string;
}

const LEAD_STORAGE_KEY = "eda360.leads.v1";

export const saveCommercialLeadLocal = (payload: CommercialLeadPayload) => {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(LEAD_STORAGE_KEY);
  const current = raw ? (JSON.parse(raw) as CommercialLeadPayload[]) : [];
  const next = [{ ...payload }, ...current].slice(0, 300);
  localStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify(next));
};
