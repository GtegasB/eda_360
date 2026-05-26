import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const leadSchema = z
  .object({
    diagnosticId: z.string().uuid().optional(),
    companyName: z.string().min(1),
    contactName: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().min(8).optional(),
    preferredChannel: z.string().optional(),
    ctaOrigin: z.string().min(1),
    ctaLabel: z.string().min(1),
    scoreGeneral: z.number().int().min(0).max(100).optional(),
    maturityLevel: z.string().optional(),
    notes: z.string().optional(),
    payload: z.record(z.any()).optional(),
  })
  .refine((data) => Boolean(data.email || data.phone), {
    message: "email_or_phone_required",
  });

const getSupabaseAdmin = () => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "method_not_allowed" }) };
  }

  try {
    const parsed = leadSchema.parse(JSON.parse(event.body || "{}"));
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true, mode: "fallback_local", message: "supabase_not_configured" }),
      };
    }

    const { data: leadData, error: leadError } = await supabase
      .from("eda360_leads")
      .insert({
        diagnostic_id: parsed.diagnosticId ?? null,
        company_name: parsed.companyName,
        contact_name: parsed.contactName ?? null,
        email: parsed.email ?? null,
        phone: parsed.phone ?? null,
        preferred_channel: parsed.preferredChannel ?? null,
        cta_origin: parsed.ctaOrigin,
        cta_label: parsed.ctaLabel,
        score_general: parsed.scoreGeneral ?? null,
        maturity_level: parsed.maturityLevel ?? null,
        notes: parsed.notes ?? null,
        payload: parsed.payload ?? {},
      })
      .select("id")
      .single();

    if (leadError) throw leadError;

    await supabase.from("eda360_diagnostic_events").insert({
      diagnostic_id: parsed.diagnosticId ?? null,
      event_type: "lead_submitted",
      event_label: parsed.ctaLabel,
      payload: {
        ctaOrigin: parsed.ctaOrigin,
        companyName: parsed.companyName,
        leadId: leadData?.id,
      },
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true, mode: "supabase", leadId: leadData?.id }) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: message }) };
  }
};

