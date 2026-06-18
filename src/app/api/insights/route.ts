import { NextRequest, NextResponse } from "next/server";
import { isDashboardAuthed } from "@/lib/auth";
import { getClientConfig } from "@/lib/clients";
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
} from "@/lib/meta-api";
import { getMetaCredentials } from "@/lib/settings";

const VALID_PRESETS: DatePreset[] = [
  "today",
  "yesterday",
  "last_7d",
  "last_14d",
  "last_30d",
  "this_month",
  "last_month",
];

export async function GET(request: NextRequest) {
  if (!(await isDashboardAuthed(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const preset = (searchParams.get("preset") || "last_30d") as DatePreset;

  if (!VALID_PRESETS.includes(preset)) {
    return NextResponse.json({ error: "Preset inválido" }, { status: 400 });
  }

  try {
    const client = getClientConfig();
    const publicSettings = await getPublicSettings();

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

    const { token, adAccountId } = await getMetaCredentials();

    const [accountInfo, dailyInsights, campaignInsights, adSetInsights] =
      await Promise.all([
        fetchAdAccountInfo(adAccountId, token),
        fetchAccountInsights(adAccountId, token, preset),
        fetchCampaignInsights(adAccountId, token, preset),
        fetchAdSetInsights(adAccountId, token, preset),
      ]);

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
      preset,
      totals,
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
