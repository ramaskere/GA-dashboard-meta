import type { AdSetSegmentation } from "./adset-segmentation";
import { humanizeMetaError } from "./meta-errors";

const GRAPH_API_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  daily_budget?: string;
  lifetime_budget?: string;
}

export interface MetaAdSet {
  id: string;
  name: string;
  status: string;
  campaign_id: string;
  daily_budget?: string;
}

export interface MetaAd {
  id: string;
  name: string;
  status: string;
  adset_id?: string;
  campaign_id?: string;
}

interface MetaErrorBody {
  error?: {
    message?: string;
    error_user_msg?: string;
    error_user_title?: string;
    code?: number;
  };
}

function metaErrorMessage(data: MetaErrorBody): string {
  const e = data.error;
  if (!e) return "Error de Meta API";
  return humanizeMetaError(e.error_user_msg || e.message || "Error de Meta API");
}

async function metaGet<T>(
  path: string,
  token: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`${GRAPH_BASE}${path}`);
  url.searchParams.set("access_token", token);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(metaErrorMessage(data));
  }
  return data as T;
}

async function metaPostForm<T>(
  path: string,
  token: string,
  fields: Record<string, string>
): Promise<T> {
  const body = new URLSearchParams();
  body.set("access_token", token);
  for (const [key, value] of Object.entries(fields)) {
    body.set(key, value);
  }

  const res = await fetch(`${GRAPH_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(metaErrorMessage(data));
  }
  return data as T;
}

/** Meta recibe presupuesto en centavos (centavos de ARS si la cuenta es ARS). */
export function toMetaBudget(amount: number): string {
  return String(Math.round(amount * 100));
}

export function adSetConfigForObjective(objective: string): Record<string, string> {
  const base: Record<string, string> = {
    bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    status: "PAUSED",
  };

  switch (objective) {
    case "OUTCOME_LEADS":
      return {
        ...base,
        optimization_goal: "LEAD_GENERATION",
        billing_event: "IMPRESSIONS",
        destination_type: "ON_AD",
      };
    case "OUTCOME_SALES":
      return {
        ...base,
        optimization_goal: "OFFSITE_CONVERSIONS",
        billing_event: "IMPRESSIONS",
      };
    case "OUTCOME_ENGAGEMENT":
      return {
        ...base,
        optimization_goal: "POST_ENGAGEMENT",
        billing_event: "IMPRESSIONS",
      };
    case "OUTCOME_AWARENESS":
      return {
        ...base,
        optimization_goal: "REACH",
        billing_event: "IMPRESSIONS",
      };
    case "OUTCOME_TRAFFIC":
    default:
      return {
        ...base,
        optimization_goal: "LINK_CLICKS",
        billing_event: "IMPRESSIONS",
      };
  }
}

export function buildTargeting(seg: AdSetSegmentation): Record<string, unknown> {
  if (!seg.countries.length) {
    throw new Error("Seleccioná al menos un país para la segmentación");
  }

  const targeting: Record<string, unknown> = {
    geo_locations: { countries: seg.countries },
    age_min: Math.max(18, seg.ageMin),
    age_max: Math.min(65, Math.max(seg.ageMin, seg.ageMax)),
  };

  if (seg.placement === "instagram_only") {
    targeting.publisher_platforms = ["instagram"];
    targeting.instagram_positions = [
      "stream",
      "story",
      "reels",
      "explore",
      "profile_feed",
    ];
  } else if (seg.placement === "facebook_only") {
    targeting.publisher_platforms = ["facebook"];
    targeting.facebook_positions = [
      "feed",
      "story",
      "marketplace",
      "video_feeds",
      "right_hand_column",
    ];
  } else if (seg.placement === "facebook_instagram") {
    targeting.publisher_platforms = ["facebook", "instagram"];
    targeting.facebook_positions = ["feed", "story", "marketplace", "video_feeds"];
    targeting.instagram_positions = ["stream", "story", "reels", "explore"];
  }

  return targeting;
}

export function buildPromotedObjectFields(
  objective: string,
  seg: AdSetSegmentation
): Record<string, string> {
  if (objective === "OUTCOME_SALES") {
    if (!seg.pixelId) {
      throw new Error(
        "Para campañas de Ventas elegí el Pixel y el evento de conversión"
      );
    }
    return {
      promoted_object: JSON.stringify({
        pixel_id: seg.pixelId,
        custom_event_type: seg.pixelEvent || "PURCHASE",
      }),
    };
  }

  if (objective === "OUTCOME_LEADS") {
    if (!seg.pageId) {
      throw new Error("Para Leads necesitás elegir la página de Facebook");
    }
    return {
      promoted_object: JSON.stringify({ page_id: seg.pageId }),
    };
  }

  if (objective === "OUTCOME_ENGAGEMENT" && seg.pageId) {
    return {
      promoted_object: JSON.stringify({ page_id: seg.pageId }),
    };
  }

  return {};
}

export async function getCampaign(campaignId: string, token: string) {
  return metaGet<{
    id: string;
    name: string;
    objective: string;
    daily_budget?: string;
    lifetime_budget?: string;
  }>(`/${campaignId}`, token, {
    fields: "id,name,objective,daily_budget,lifetime_budget",
  });
}

export async function listCampaigns(adAccountId: string, token: string) {
  const res = await metaGet<{ data: MetaCampaign[] }>(
    `/${adAccountId}/campaigns`,
    token,
    {
      fields: "id,name,status,objective,daily_budget,lifetime_budget",
      limit: "100",
    }
  );
  return res.data || [];
}

export async function listAdSets(adAccountId: string, token: string) {
  const res = await metaGet<{ data: MetaAdSet[] }>(
    `/${adAccountId}/adsets`,
    token,
    {
      fields: "id,name,status,campaign_id,daily_budget",
      limit: "100",
    }
  );
  return res.data || [];
}

export async function listAds(adAccountId: string, token: string) {
  const res = await metaGet<{ data: MetaAd[] }>(
    `/${adAccountId}/ads`,
    token,
    {
      fields: "id,name,status,adset_id,campaign_id",
      limit: "100",
    }
  );
  return res.data || [];
}

/** Campaña — presupuesto opcional (CBO si se define dailyBudget). */
export async function createCampaign(
  adAccountId: string,
  token: string,
  input: {
    name: string;
    objective: string;
    dailyBudget?: number;
    status?: "PAUSED" | "ACTIVE";
  }
) {
  const fields: Record<string, string> = {
    name: input.name,
    objective: input.objective,
    status: input.status || "PAUSED",
    special_ad_categories: "[]",
  };

  if (input.dailyBudget && input.dailyBudget > 0) {
    fields.daily_budget = toMetaBudget(input.dailyBudget);
    fields.is_adset_budget_sharing_enabled = "true";
  } else {
    fields.is_adset_budget_sharing_enabled = "false";
  }

  return metaPostForm<{ id: string }>(`/${adAccountId}/campaigns`, token, fields);
}

export async function createAdSet(
  adAccountId: string,
  token: string,
  input: {
    name: string;
    campaignId: string;
    dailyBudget?: number;
    objective?: string;
    segmentation: AdSetSegmentation;
  }
) {
  let objective = input.objective;
  const campaign = await getCampaign(input.campaignId, token);
  if (!objective) objective = campaign.objective;

  const campaignUsesCbo = Boolean(
    campaign.daily_budget && parseInt(campaign.daily_budget, 10) > 0
  );

  if (
    !campaignUsesCbo &&
    (!input.dailyBudget || input.dailyBudget <= 0)
  ) {
    throw new Error(
      "Definí presupuesto en el ad set o creá la campaña con presupuesto (CBO)"
    );
  }

  const seg: AdSetSegmentation = {
    ...input.segmentation,
    pageId: input.segmentation.pageId,
  };

  const targeting = JSON.stringify(buildTargeting(seg));
  const objectiveConfig = adSetConfigForObjective(objective);
  const promotedFields = buildPromotedObjectFields(objective, seg);

  const fields: Record<string, string> = {
    name: input.name,
    campaign_id: input.campaignId,
    targeting,
    ...objectiveConfig,
    ...promotedFields,
  };

  if (!campaignUsesCbo && input.dailyBudget) {
    fields.daily_budget = toMetaBudget(input.dailyBudget);
  }

  return metaPostForm<{ id: string }>(`/${adAccountId}/adsets`, token, fields);
}

export async function uploadAdImage(
  adAccountId: string,
  token: string,
  imageBase64: string,
  filename: string
) {
  const res = await metaPostForm<{
    images: Record<string, { hash: string; url?: string }>;
  }>(`/${adAccountId}/adimages`, token, {
    bytes: imageBase64,
    name: filename,
  });

  const first = Object.values(res.images || {})[0];
  if (!first?.hash) {
    throw new Error("No se pudo subir la imagen a Meta");
  }
  return first.hash;
}

export async function createAdWithImage(
  adAccountId: string,
  token: string,
  input: {
    adSetId: string;
    pageId: string;
    imageHash: string;
    adName: string;
    primaryText: string;
    headline: string;
    linkUrl: string;
  }
) {
  const objectStorySpec = JSON.stringify({
    page_id: input.pageId,
    link_data: {
      image_hash: input.imageHash,
      link: input.linkUrl,
      message: input.primaryText,
      name: input.headline,
      call_to_action: { type: "SHOP_NOW" },
    },
  });

  const creative = await metaPostForm<{ id: string }>(
    `/${adAccountId}/adcreatives`,
    token,
    {
      name: `${input.adName} — creativo`,
      object_story_spec: objectStorySpec,
    }
  );

  return metaPostForm<{ id: string }>(`/${adAccountId}/ads`, token, {
    name: input.adName,
    adset_id: input.adSetId,
    creative: JSON.stringify({ creative_id: creative.id }),
    status: "PAUSED",
  });
}

export async function listPixels(adAccountId: string, token: string) {
  const res = await metaGet<{
    data: Array<{ id: string; name: string }>;
  }>(`/${adAccountId}/adspixels`, token, {
    fields: "id,name",
    limit: "50",
  });
  return res.data || [];
}

export async function listAdAccounts(token: string) {
  const res = await metaGet<{
    data: Array<{
      id: string;
      name: string;
      account_id: string;
      currency?: string;
      account_status?: number;
    }>;
  }>("/me/adaccounts", token, {
    fields: "id,name,account_id,currency,account_status",
    limit: "100",
  });
  return res.data || [];
}

export async function getAdAccountPages(adAccountId: string, token: string) {
  const fromPromote = await metaGet<{
    data: Array<{ id: string; name: string }>;
  }>(`/${adAccountId}/promote_pages`, token, {
    fields: "id,name",
    limit: "25",
  }).catch(() => ({ data: [] }));

  if (fromPromote.data?.length) return fromPromote.data;

  const fromAssigned = await metaGet<{
    data: Array<{ id: string; name: string }>;
  }>(`/${adAccountId}/assigned_pages`, token, {
    fields: "id,name",
    limit: "25",
  }).catch(() => ({ data: [] }));

  return fromAssigned.data || [];
}

export const CAMPAIGN_OBJECTIVES = [
  { value: "OUTCOME_TRAFFIC", label: "Tráfico" },
  { value: "OUTCOME_ENGAGEMENT", label: "Interacción" },
  { value: "OUTCOME_LEADS", label: "Leads" },
  { value: "OUTCOME_SALES", label: "Ventas" },
  { value: "OUTCOME_AWARENESS", label: "Reconocimiento" },
];

/** Mínimo sugerido en unidades de la moneda de la cuenta (orientativo). */
export const SUGGESTED_MIN_DAILY_BUDGET = 5;
