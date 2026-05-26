import { CommercialLeadPayload, saveCommercialLeadLocal } from "./leadRepository";

export interface LeadApiResult {
  ok: boolean;
  mode: "supabase" | "fallback_local";
  leadId?: string;
  error?: string;
}

export const submitEda360Lead = async (payload: CommercialLeadPayload): Promise<LeadApiResult> => {
  try {
    const response = await fetch("/.netlify/functions/eda360-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        diagnosticId: payload.diagnosticId,
        companyName: payload.companyName,
        contactName: payload.contactName,
        email: payload.email,
        phone: payload.phone,
        preferredChannel: payload.preferredChannel,
        ctaOrigin: payload.ctaOrigin,
        ctaLabel: payload.ctaLabel || "Quero organizar minha E.D.A.",
        scoreGeneral: payload.scoreGeneral,
        maturityLevel: payload.maturityLevel,
        notes: payload.notes,
        payload,
      }),
    });

    const data = (await response.json()) as LeadApiResult;

    if (!response.ok || !data.ok) {
      saveCommercialLeadLocal(payload);
      return { ok: true, mode: "fallback_local", error: data.error || "lead_api_failed" };
    }

    return data;
  } catch {
    saveCommercialLeadLocal(payload);
    return { ok: true, mode: "fallback_local", error: "network_error" };
  }
};

