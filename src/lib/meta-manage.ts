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
    throw new Error(data.error?.message || `Meta API error ${res.status}`);
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
    throw new Error(data.error?.message || `Meta API error ${res.status}`);
  }
  return data as T;
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
    is_adset_budget_sharing_enabled: "false",
  };

  if (input.dailyBudget && input.dailyBudget > 0) {
    fields.daily_budget = String(Math.round(input.dailyBudget * 100));
  }

  return metaPostForm<{ id: string }>(`/${adAccountId}/campaigns`, token, fields);
}

export async function createAdSet(
  adAccountId: string,
  token: string,
  input: {
    name: string;
    campaignId: string;
    dailyBudget: number;
    pageId?: string;
  }
) {
  const targeting = JSON.stringify({
    geo_locations: { countries: ["AR"] },
    age_min: 18,
  });

  const fields: Record<string, string> = {
    name: input.name,
    campaign_id: input.campaignId,
    daily_budget: String(Math.round(input.dailyBudget * 100)),
    billing_event: "IMPRESSIONS",
    optimization_goal: "LINK_CLICKS",
    bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    status: "PAUSED",
    targeting,
  };

  if (input.pageId) {
    fields.promoted_object = JSON.stringify({ page_id: input.pageId });
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

export async function getAdAccountPages(adAccountId: string, token: string) {
  const res = await metaGet<{
    data: Array<{ id: string; name: string }>;
  }>(`/${adAccountId}/promote_pages`, token, {
    fields: "id,name",
    limit: "25",
  });
  return res.data || [];
}

export const CAMPAIGN_OBJECTIVES = [
  { value: "OUTCOME_TRAFFIC", label: "Tráfico" },
  { value: "OUTCOME_ENGAGEMENT", label: "Interacción" },
  { value: "OUTCOME_LEADS", label: "Leads" },
  { value: "OUTCOME_SALES", label: "Ventas" },
  { value: "OUTCOME_AWARENESS", label: "Reconocimiento" },
];
