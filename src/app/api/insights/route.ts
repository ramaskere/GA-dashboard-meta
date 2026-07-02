import { NextRequest, NextResponse } from "next/server";
import { isDashboardAuthed } from "@/lib/auth";
import { getClientConfig, resolveClientIdFromRequest } from "@/lib/clients";
import { getPublicSettings } from "@/lib/settings";
import {
  fetchAccountInsights,
  fetchCampaignInsights,
  fetchAdSetInsights,
  fetchAdAccountInfo,
  sumInsights,
  aggregateByCampaign,
  parseNumber,
  type DatePreset,
  type InsightsQuery,
  type InsightsFilter,
} from "@/lib/meta-api";
import { getMetaCredentials } from "@/lib/settings";
import { buildComparison } from "@/lib/comparison";
import {
  currentMonthKey,
  formatMonthLabel,
  isValidMonthKey,
  monthElapsedPercent,
  monthToTimeRange,
  previousMonthKey,
} from "@/lib/months";

const VALID_PRESETS: DatePreset[] = [
  "today",
  "yesterday",
  "last_7d",
  "last_14d",
  "last_30d",
  "this_month",
  "last_month",
];

function resolveQuery(searchParams: URLSearchParams): InsightsQuery {
  const month = searchParams.get("month");
  if (month && isValidMonthKey(month)) {
    return { type: "month", month };
  }

  const preset = (searchParams.get("preset") || "") as DatePreset;
  if (preset && VALID_PRESETS.includes(preset)) {
    return { type: "preset", preset };
  }

  return { type: "month", month: currentMonthKey() };
}

function resolveFilter(searchParams: URLSearchParams): InsightsFilter | undefined {
  const campaignId = searchParams.get("campaignId");
  if (campaignId && campaignId !== "all") {
    return { campaignIds: [campaignId] };
  }
  return undefined;
}

export async function GET(request: NextRequest) {
  if (!(await isDashboardAuthed(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = resolveQuery(searchParams);
  const filter = resolveFilter(searchParams);
  const clientId = resolveClientIdFromRequest(request);

  try {
    const client = getClientConfig(clientId);
    const publicSettings = await getPublicSettings(clientId);

    if (!publicSettings.configured) {
      return NextResponse.json(
        {
          error: "API de Meta no configurada",
          hint: "Andá a /settings y cargá el token y el Ad Account ID.",
          needsSetup: true,
        },
        { status: 503 }
      );
    }

    const { token, adAccountId } = await getMetaCredentials(clientId);

    const prevQuery: InsightsQuery | null =
      query.type === "month"
        ? { type: "month", month: previousMonthKey(query.month) }
        : null;

    const fetches: Promise<unknown>[] = [
      fetchAdAccountInfo(adAccountId, token),
      fetchAccountInsights(adAccountId, token, query, filter),
      fetchCampaignInsights(adAccountId, token, query),
      fetchAdSetInsights(adAccountId, token, query, filter),
    ];

    if (prevQuery) {
      fetches.push(
        fetchAccountInsights(adAccountId, token, prevQuery, filter)
      );
    }

    const results = await Promise.all(fetches);
    const accountInfo = results[0] as Awaited<ReturnType<typeof fetchAdAccountInfo>>;
    const dailyInsights = results[1] as Awaited<ReturnType<typeof fetchAccountInsights>>;
    const campaignInsights = results[2] as Awaited<ReturnType<typeof fetchCampaignInsights>>;
    const adSetInsights = results[3] as Awaited<ReturnType<typeof fetchAdSetInsights>>;
    const prevInsights = prevQuery
      ? (results[4] as Awaited<ReturnType<typeof fetchAccountInsights>>)
      : null;

    const daily = dailyInsights.data || [];
    const totals = sumInsights(daily);
    const campaigns = aggregateByCampaign(campaignInsights.data || []);

    const dailyChart = daily.map((row) => ({
      date: row.date_start,
      spend: parseNumber(row.spend),
      impressions: parseNumber(row.impressions),
      clicks: parseNumber(row.clicks),
      reach: parseNumber(row.reach),
    }));

    const campaignTable = campaigns.map((c) => ({
      id: c.campaign_id,
      name: c.campaign_name || "Sin nombre",
      spend: c.spendNum,
      impressions: c.impressionsNum,
      clicks: c.clicksNum,
      ctr:
        c.impressionsNum > 0 ? (c.clicksNum / c.impressionsNum) * 100 : 0,
      cpc: c.clicksNum > 0 ? c.spendNum / c.clicksNum : 0,
    }));

    const adSetTable = (adSetInsights.data || [])
      .map((row) => ({
        id: row.adset_id,
        name: row.adset_name || "Sin nombre",
        campaign: row.campaign_name || "",
        spend: parseNumber(row.spend),
        impressions: parseNumber(row.impressions),
        clicks: parseNumber(row.clicks),
        ctr: parseNumber(row.ctr),
        cpc: parseNumber(row.cpc),
      }))
      .sort((a, b) => b.spend - a.spend);

    const range =
      query.type === "month" ? monthToTimeRange(query.month) : null;

    let previousPeriod:
      | {
          month: string;
          label: string;
          totals: ReturnType<typeof sumInsights>;
          changePct: ReturnType<typeof buildComparison>;
        }
      | undefined;

    if (prevQuery && prevInsights) {
      const prevMonth = prevQuery.month;
      const prevTotals = sumInsights(prevInsights.data || []);
      previousPeriod = {
        month: prevMonth,
        label: formatMonthLabel(prevMonth),
        totals: prevTotals,
        changePct: buildComparison(totals, prevTotals),
      };
    }

    return NextResponse.json({
      client: {
        id: client.id,
        name: client.name,
        currency: accountInfo.currency || client.currency,
      },
      account: {
        name: accountInfo.name,
        status: accountInfo.account_status,
        timezone: accountInfo.timezone_name,
      },
      widgetConfig: publicSettings.widgetConfig,
      period: {
        type: query.type,
        month: query.type === "month" ? query.month : undefined,
        preset: query.type === "preset" ? query.preset : undefined,
        label:
          query.type === "month"
            ? formatMonthLabel(query.month)
            : query.preset,
        range,
        isCurrentMonth:
          query.type === "month" && query.month === currentMonthKey(),
        monthElapsedPct:
          query.type === "month"
            ? monthElapsedPercent(query.month)
            : undefined,
      },
      filter: filter?.campaignIds?.[0]
        ? { campaignId: filter.campaignIds[0] }
        : null,
      totals,
      previousPeriod,
      daily: dailyChart,
      campaigns: campaignTable,
      adSets: adSetTable,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      {
        error: message,
        hint: "Verificá el token y el Ad Account ID en /settings. El token necesita permiso ads_read.",
      },
      { status: 500 }
    );
  }
}
