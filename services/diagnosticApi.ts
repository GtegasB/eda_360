import { CompanyInput, EDAReport } from "../types";

export const runDiagnostic = async (input: CompanyInput): Promise<EDAReport> => {
  const response = await fetch("/.netlify/functions/diagnose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`DIAGNOSTIC_API_ERROR_${response.status}:${body}`);
  }

  return (await response.json()) as EDAReport;
};

