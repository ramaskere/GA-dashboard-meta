export interface AdSetSegmentation {
  countries: string[];
  ageMin: number;
  ageMax: number;
  placement: "auto" | "facebook_instagram" | "instagram_only" | "facebook_only";
  pixelId?: string;
  pixelEvent?: string;
  pageId?: string;
}

export const COUNTRY_OPTIONS = [
  { code: "AR", label: "Argentina" },
  { code: "CL", label: "Chile" },
  { code: "UY", label: "Uruguay" },
  { code: "PY", label: "Paraguay" },
  { code: "BO", label: "Bolivia" },
  { code: "BR", label: "Brasil" },
  { code: "MX", label: "México" },
  { code: "CO", label: "Colombia" },
  { code: "PE", label: "Perú" },
  { code: "US", label: "Estados Unidos" },
  { code: "ES", label: "España" },
];

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

export function defaultSegmentation(): AdSetSegmentation {
  return {
    countries: ["AR"],
    ageMin: 18,
    ageMax: 65,
    placement: "facebook_instagram",
    pixelEvent: "PURCHASE",
  };
}

export function parseSegmentationFromBody(body: Record<string, unknown>): AdSetSegmentation {
  const def = defaultSegmentation();
  const countries = Array.isArray(body.countries)
    ? body.countries.map(String).filter(Boolean)
    : def.countries;

  return {
    countries: countries.length ? countries : def.countries,
    ageMin: Number(body.ageMin) || def.ageMin,
    ageMax: Number(body.ageMax) || def.ageMax,
    placement: (body.placement as AdSetSegmentation["placement"]) || def.placement,
    pixelId: body.pixelId ? String(body.pixelId) : undefined,
    pixelEvent: body.pixelEvent ? String(body.pixelEvent) : def.pixelEvent,
    pageId: body.pageId ? String(body.pageId) : undefined,
  };
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
