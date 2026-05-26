export type Eda360EventType =
  | "diagnostic_started"
  | "diagnostic_completed"
  | "report_opened"
  | "cta_clicked"
  | "lead_submitted";

export interface TrackEventPayload {
  diagnosticId?: string;
  eventType: Eda360EventType;
  eventLabel?: string;
  payload?: Record<string, unknown>;
}

export const trackEda360Event = async (event: TrackEventPayload): Promise<void> => {
  try {
    await fetch("/.netlify/functions/eda360-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
  } catch {
    // não bloquear UX por falha de rastreio
  }
};

