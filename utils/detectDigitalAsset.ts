export type DigitalAssetType = "instagram" | "website" | "whatsapp" | "google" | "company_name" | "unknown";
export type DetectionConfidence = "low" | "medium" | "high";

export interface DigitalAssetDetection {
  assetType: DigitalAssetType;
  normalizedValue: string;
  displayLabel: string;
  confidence: DetectionConfidence;
}

const WEBSITE_REGEX = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/.*)?$/i;
const BR_PHONE_REGEX = /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\d{4}|\d{4})-?\d{4}/;

const normalize = (value: string) => value.trim();

export const detectDigitalAsset = (rawValue: string): DigitalAssetDetection => {
  const input = normalize(rawValue);
  const lower = input.toLowerCase();

  if (!input) {
    return {
      assetType: "unknown",
      normalizedValue: "",
      displayLabel: "Ativo não identificado",
      confidence: "low",
    };
  }

  if (lower.startsWith("@") || lower.includes("instagram.com")) {
    const handle = input.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "@").replace(/\/$/, "");
    return {
      assetType: "instagram",
      normalizedValue: handle,
      displayLabel: "Instagram detectado",
      confidence: "high",
    };
  }

  if (
    lower.includes("google.com/maps") ||
    lower.includes("google.com/search") ||
    lower.includes("g.page") ||
    lower.includes("google business") ||
    lower.includes("business.google")
  ) {
    return {
      assetType: "google",
      normalizedValue: input,
      displayLabel: "Google detectado",
      confidence: "high",
    };
  }

  if (lower.includes("wa.me") || lower.includes("whatsapp") || BR_PHONE_REGEX.test(input)) {
    return {
      assetType: "whatsapp",
      normalizedValue: input,
      displayLabel: "WhatsApp detectado",
      confidence: lower.includes("wa.me") || lower.includes("whatsapp") ? "high" : "medium",
    };
  }

  if (
    lower.startsWith("http") ||
    lower.startsWith("www.") ||
    lower.includes(".com") ||
    lower.includes(".com.br") ||
    lower.includes(".net") ||
    lower.includes(".org") ||
    WEBSITE_REGEX.test(input)
  ) {
    const normalizedValue = lower.startsWith("http") ? input : `https://${input}`;
    return {
      assetType: "website",
      normalizedValue,
      displayLabel: "Site detectado",
      confidence: "high",
    };
  }

  if (input.length >= 3) {
    return {
      assetType: "company_name",
      normalizedValue: input,
      displayLabel: "Nome da empresa detectado",
      confidence: "medium",
    };
  }

  return {
    assetType: "unknown",
    normalizedValue: input,
    displayLabel: "Ativo não identificado",
    confidence: "low",
  };
};

