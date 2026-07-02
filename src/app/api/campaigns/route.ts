import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { getPublicSettings, getMetaCredentials, getDefaultPageId } from "@/lib/settings";
import {
  parseSegmentationFromBody,
  parseBudgetLevel,
  campaignHasBudget,
} from "@/lib/adset-segmentation";
import {
  listCampaigns,
  listAdSets,
  listAds,
  createCampaign,
  createAdSet,
  getAdAccountPages,
  listPixels,
  CAMPAIGN_OBJECTIVES,
  SUGGESTED_MIN_DAILY_BUDGET,
} from "@/lib/meta-manage";
import { fetchAdAccountInfo } from "@/lib/meta-api";

export async function GET() {
  try {
    const pub = await getPublicSettings();
    if (!pub.configured) {
      return NextResponse.json(
        { error: "API no configurada", needsSetup: true },
        { status: 503 }
      );
    }

    const { token, adAccountId } = await getMetaCredentials();
    const defaultPageId = await getDefaultPageId();
    const [campaigns, adSets, ads, pages, pixels, account] = await Promise.all([
      listCampaigns(adAccountId, token),
      listAdSets(adAccountId, token),
      listAds(adAccountId, token),
      getAdAccountPages(adAccountId, token).catch(() => []),
      listPixels(adAccountId, token).catch(() => []),
      fetchAdAccountInfo(adAccountId, token),
    ]);

    return NextResponse.json({
      campaigns,
      adSets,
      ads,
      pages,
      pixels,
      objectives: CAMPAIGN_OBJECTIVES,
      accountCurrency: account.currency,
      adAccountId,
      suggestedMinDailyBudget: SUGGESTED_MIN_DAILY_BUDGET,
      defaultPageId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      {
        error: message,
        hint: "Para crear campañas el token necesita permiso ads_management.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthed(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { token, adAccountId } = await getMetaCredentials();
    const action = String(body.action || "");
    const budgetLevel = parseBudgetLevel(body);
    const dailyBudget = Number(body.dailyBudget) || 0;

    if (action === "create_campaign") {
      const name = String(body.name || "").trim();
      if (!name) {
        return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
      }

      const campaign = await createCampaign(adAccountId, token, {
        name,
        objective: String(body.objective || "OUTCOME_TRAFFIC"),
        dailyBudget:
          budgetLevel === "campaign" && dailyBudget > 0
            ? dailyBudget
            : undefined,
        status: "PAUSED",
      });

      return NextResponse.json({
        ok: true,
        campaignId: campaign.id,
        message: `Campaña "${name}" creada en pausa${
          budgetLevel === "campaign" && dailyBudget > 0 ? " con presupuesto CBO" : ""
        }.`,
      });
    }

    if (action === "create_adset") {
      const name = String(body.name || "").trim();
      const campaignId = String(body.campaignId || "").trim();
      const segmentation = parseSegmentationFromBody(body);

      if (!name || !campaignId) {
        return NextResponse.json(
          { error: "Nombre y campaña requeridos" },
          { status: 400 }
        );
      }

      const campaigns = await listCampaigns(adAccountId, token);
      const parent = campaigns.find((c) => c.id === campaignId);
      const useCbo = campaignHasBudget(parent);

      const adSet = await createAdSet(adAccountId, token, {
        name,
        campaignId,
        dailyBudget:
          !useCbo && budgetLevel === "adset" && dailyBudget > 0
            ? dailyBudget
            : undefined,
        segmentation,
      });

      return NextResponse.json({
        ok: true,
        adSetId: adSet.id,
        message: `Ad set "${name}" creado en pausa.`,
      });
    }

    if (action === "create_full") {
      const campName = String(body.campaignName || "").trim();
      const adSetName = String(body.adSetName || "").trim();
      const objective = String(body.objective || "OUTCOME_TRAFFIC");
      const segmentation = parseSegmentationFromBody(body);

      if (!campName || !adSetName) {
        return NextResponse.json(
          { error: "Completá nombre de campaña y ad set" },
          { status: 400 }
        );
      }

      if (budgetLevel === "campaign" && dailyBudget <= 0) {
        return NextResponse.json(
          { error: "Con presupuesto en campaña, indicá el monto diario" },
          { status: 400 }
        );
      }

      if (budgetLevel === "adset" && dailyBudget <= 0) {
        return NextResponse.json(
          { error: "Con presupuesto en ad set, indicá el monto diario" },
          { status: 400 }
        );
      }

      const campaign = await createCampaign(adAccountId, token, {
        name: campName,
        objective,
        dailyBudget:
          budgetLevel === "campaign" ? dailyBudget : undefined,
        status: "PAUSED",
      });

      const adSet = await createAdSet(adAccountId, token, {
        name: adSetName,
        campaignId: campaign.id,
        dailyBudget: budgetLevel === "adset" ? dailyBudget : undefined,
        objective,
        segmentation,
      });

      return NextResponse.json({
        ok: true,
        campaignId: campaign.id,
        adSetId: adSet.id,
        message: "Campaña y ad set creados en pausa. Ahora subí el anuncio.",
      });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}