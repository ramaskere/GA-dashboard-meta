import { humanizeMetaError } from "./meta-errors";
import { monthToTimeRange, type MonthRange } from "./months";

const GRAPH_API_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export type DatePreset =
  | "today"
  | "yesterday"
  | "last_7d"
  | "last_14d"
  | "last_30d"
  | "this_month"
  | "last_month";

export interface MetaInsightRow {
  date_start: string;
  date_stop: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  reach?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  frequency?: string;
  actions?: Array<{ action_type: string; value: string }>;
  cost_per_action_type?: Array<{ action_type: string; value: string }>;
  campaign_name?: string;
  campaign_id?: string;
  adset_name?: string;
  adset_id?: string;
  ad_name?: string;
  ad_id?: string;
}

export interface MetaApiError {
  error: string;
  hint?: string;
}

async function metaFetch<T>(
  path: string,
  token: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`${GRAPH_BASE}${path}`);
  url.searchParams.set("access_token", token);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  const data = await res.json();

  if (!res.ok || data.error) {
    const msg = data.error?.message || `Meta API error ${res.status}`;
    throw new Error(humanizeMetaError(msg));
  }

  return data as T;
}

const INSIGHT_FIELDS = [
  "spend",
  "impressions",
  "clicks",
  "reach",
  "ctr",
  "cpc",
  "cpm",
  "frequency",
  "actions",
  "cost_per_action_type",
].join(",");

export type InsightsQuery =
  | { type: "preset"; preset: DatePreset }
  | { type: "month"; month: string };

export interface InsightsFilter {
  campaignIds?: string[];
}

function buildDateParams(query: InsightsQuery): Record<string, string> {
  if (query.type === "preset") {
    return { date_preset: query.preset };
  }
  const range: MonthRange = monthToTimeRange(query.month);
  return {
    time_range: JSON.stringify({ since: range.since, until: range.until }),
  };
}

function buildFilterParams(filter?: InsightsFilter): Record<string, string> {
  if (!filter?.campaignIds?.length) return {};
  return {
    filtering: JSON.stringify([
      {
        field: "campaign.id",
        operator: "IN",
        value: filter.campaignIds,
      },
    ]),
  };
}

export async function fetchAccountInsights(
  adAccountId: string,
  token: string,
  query: InsightsQuery,
  filter?: InsightsFilter
) {
  return metaFetch<{ data: MetaInsightRow[] }>(
    `/${adAccountId}/insights`,
    token,
    {
      fields: INSIGHT_FIELDS,
      ...buildDateParams(query),
      ...buildFilterParams(filter),
      time_increment: "1",
    }
  );
}

export async function fetchCampaignInsights(
  adAccountId: string,
  token: string,
  query: InsightsQuery,
  filter?: InsightsFilter
) {
  return metaFetch<{ data: MetaInsightRow[] }>(
    `/${adAccountId}/insights`,
    token,
    {
      fields: `${INSIGHT_FIELDS},campaign_name,campaign_id`,
      ...buildDateParams(query),
      ...buildFilterParams(filter),
      level: "campaign",
    }
  );
}

export async function fetchAdSetInsights(
  adAccountId: string,
  token: string,
  query: InsightsQuery,
  filter?: InsightsFilter
) {
  return metaFetch<{ data: MetaInsightRow[] }>(
    `/${adAccountId}/insights`,
    token,
    {
      fields: `${INSIGHT_FIELDS},adset_name,adset_id,campaign_name`,
      ...buildDateParams(query),
      ...buildFilterParams(filter),
      level: "adset",
      limit: "50",
    }
  );
}

export async function fetchAdInsights(
  adAccountId: string,
  token: string,
  query: InsightsQuery,
  filter?: InsightsFilter
) {
  return metaFetch<{ data: MetaInsightRow[] }>(
    `/${adAccountId}/insights`,
    token,
    {
      fields: `${INSIGHT_FIELDS},ad_name,ad_id,adset_name,campaign_name`,
      ...buildDateParams(query),
      ...buildFilterParams(filter),
      level: "ad",
      limit: "50",
    }
  );
}

export async function fetchAdAccountInfo(adAccountId: string, token: string) {
  return metaFetch<{
    name: string;
    account_status: number;
    currency: string;
    timezone_name: string;
  }>(`/${adAccountId}`, token, {
    fields: "name,account_status,currency,timezone_name",
  });
}

export function parseNumber(value?: string): number {
  if (!value) return 0;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function getActionValue(
  actions: MetaInsightRow["actions"],
  actionType: string
): number {
  if (!actions) return 0;
  const found = actions.find((a) => a.action_type === actionType);
  return found ? parseNumber(found.value) : 0;
}

export function sumInsights(rows: MetaInsightRow[]) {
  const totals = {
    spend: 0,
    impressions: 0,
    clicks: 0,
    reach: 0,
    conversions: 0,
    messages: 0,
    leads: 0,
    purchases: 0,
  };

  for (const row of rows) {
    totals.spend += parseNumber(row.spend);
    totals.impressions += parseNumber(row.impressions);
    totals.clicks += parseNumber(row.clicks);
    totals.reach += parseNumber(row.reach);
    totals.conversions += getActionValue(row.actions, "offsite_conversion.fb_pixel_purchase");
    totals.conversions += getActionValue(row.actions, "purchase");
    totals.messages += getActionValue(row.actions, "onsite_conversion.messaging_conversation_started_7d");
    totals.leads += getActionValue(row.actions, "lead");
    totals.purchases += getActionValue(row.actions, "omni_purchase");
  }

  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
  const cpm = totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0;

  return { ...totals, ctr, cpc, cpm };
}

export function aggregateByCampaign(rows: MetaInsightRow[]) {
  const map = new Map<
    string,
    MetaInsightRow & { spendNum: number; impressionsNum: number; clicksNum: number }
  >();

  for (const row of rows) {
    const key = row.campaign_id || row.campaign_name || "unknown";
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        ...row,
        spendNum: parseNumber(row.spend),
        impressionsNum: parseNumber(row.impressions),
        clicksNum: parseNumber(row.clicks),
      });
    } else {
      existing.spendNum += parseNumber(row.spend);
      existing.impressionsNum += parseNumber(row.impressions);
      existing.clicksNum += parseNumber(row.clicks);
      existing.spend = String(existing.spendNum);
      existing.impressions = String(existing.impressionsNum);
      existing.clicks = String(existing.clicksNum);
    }
  }

  return Array.from(map.values()).sort((a, b) => b.spendNum - a.spendNum);
}
