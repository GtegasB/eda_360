import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { z } from "zod";

const eventSchema = z.object({
  diagnosticId: z.string().uuid().optional(),
  eventType: z.enum([
    "diagnostic_started",
    "diagnostic_completed",
    "report_opened",
    "cta_clicked",
    "lead_submitted",
  ]),
  eventLabel: z.string().optional(),
  payload: z.record(z.any()).optional(),
});

const getSupabaseAdmin = () => {
  if (!("WebSocket" in globalThis) || !globalThis.WebSocket) {
    (globalThis as { WebSocket?: unknown }).WebSocket = ws as unknown;
  }

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
    const parsed = eventSchema.parse(JSON.parse(event.body || "{}"));
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      return { statusCode: 200, body: JSON.stringify({ ok: true, mode: "no_supabase" }) };
    }

    const { error } = await supabase.from("eda360_diagnostic_events").insert({
      diagnostic_id: parsed.diagnosticId ?? null,
      event_type: parsed.eventType,
      event_label: parsed.eventLabel ?? null,
      payload: parsed.payload ?? {},
    });

    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify({ ok: true, mode: "supabase" }) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: message }) };
  }
};

