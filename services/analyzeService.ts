import { CompanyInput, EDAReport } from "../types";
import { analyzeWithDeepSeek } from "./deepseekService";
import { analyzeWithGemini } from "./geminiService";

/**
 * Orquestrador principal da varredura EDA360.
 * Tenta DeepSeek primeiro. Em caso de falha, cai no fallback Gemini.
 */
export const analyzeCompany = async (input: CompanyInput): Promise<EDAReport> => {
  // Tenta DeepSeek como motor principal
  try {
    const report = await analyzeWithDeepSeek(input);
    return report;
  } catch (deepseekError) {
    console.warn("DeepSeek falhou, tentando fallback Gemini:", deepseekError);
  }

  // Fallback Gemini com Google Search grounding
  try {
    const report = await analyzeWithGemini(input);
    return report;
  } catch (geminiError) {
    console.error("Ambos os motores falharam:", geminiError);
    throw geminiError;
  }
};
