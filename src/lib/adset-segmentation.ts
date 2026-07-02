import { isValidCountryCode } from "./countries";

export type BudgetLevel = "campaign" | "adset";

export interface AdSetSegmentation {
  countries: string[];
  ageMin: number;
  ageMax: number;
  placement: "auto" | "facebook_instagram" | "instagram_only" | "facebook_only";
  pixelId?: string;
  pixelEvent?: string;
  pageId?: string;
}

export const PLACEMENT_OPTIONS = [
  { value: "auto", label: "Automático (Meta elige)" },
  { value: "facebook_instagram", label: "Facebook + Instagram" },
  { value: "instagram_only", label: "Solo Instagram" },
  { value: "facebook_only", label: "Solo Facebook" },
] as const;

export const PIXEL_EVENT_OPTIONS = [
  { value: "PURCHASE", label: "Compra (Purchase)" },
  { value: "LEAD", label: "Lead" },
  { value: "ADD_TO_CART", label: "Agregar al carrito" },
  { value: "INITIATED_CHECKOUT", label: "Inicio de checkout" },
  { value: "COMPLETE_REGISTRATION", label: "Registro completo" },
  { value: "CONTENT_VIEW", label: "Vista de contenido" },
  { value: "SEARCH", label: "Búsqueda" },
];

export const BUDGET_LEVEL_OPTIONS = [
  {
    value: "adset" as const,
    label: "Ad set (ABO)",
    hint: "Cada ad set tiene su propio presupuesto diario.",
  },
  {
    value: "campaign" as const,
    label: "Campaña (CBO)",
    hint: "Meta reparte el presupuesto entre los ad sets de la campaña.",
  },
];

export function defaultSegmentation(defaultCountries: string[] = []): AdSetSegmentation {
  return {
    countries: defaultCountries.length ? [...defaultCountries] : [],
    ageMin: 18,
    ageMax: 65,
    placement: "facebook_instagram",
    pixelEvent: "PURCHASE",
  };
}

export function parseSegmentationFromBody(body: Record<string, unknown>): AdSetSegmentation {
  const def = defaultSegmentation();
  const countries = Array.isArray(body.countries)
    ? body.countries.map((c) => String(c).toUpperCase()).filter(isValidCountryCode)
    : def.countries;

  if (countries.length === 0) {
    throw new Error("Seleccioná al menos un país para la segmentación");
  }

  return {
    countries,
    ageMin: Number(body.ageMin) || def.ageMin,
    ageMax: Number(body.ageMax) || def.ageMax,
    placement: (body.placement as AdSetSegmentation["placement"]) || def.placement,
    pixelId: body.pixelId ? String(body.pixelId) : undefined,
    pixelEvent: body.pixelEvent ? String(body.pixelEvent) : def.pixelEvent,
    pageId: body.pageId ? String(body.pageId) : undefined,
  };
}

export function parseBudgetLevel(body: Record<string, unknown>): BudgetLevel {
  return body.budgetLevel === "campaign" ? "campaign" : "adset";
}

export function needsPixel(objective: string): boolean {
  return objective === "OUTCOME_SALES";
}

export function needsPage(objective: string): boolean {
  return (
    objective === "OUTCOME_LEADS" ||
    objective === "OUTCOME_ENGAGEMENT" ||
    objective === "OUTCOME_SALES"
  );
}

export function campaignHasBudget(campaign?: {
  daily_budget?: string;
  lifetime_budget?: string;
}): boolean {
  return Boolean(
    campaign?.daily_budget &&
      parseInt(campaign.daily_budget, 10) > 0
  ) || Boolean(
    campaign?.lifetime_budget &&
      parseInt(campaign.lifetime_budget, 10) > 0
  );
}
